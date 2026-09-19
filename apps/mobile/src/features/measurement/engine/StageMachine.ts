/**
 * 测量阶段机（设计文档 §4.2.2）。
 *
 * ⚠️ 阶段定义待硬件/算法确认（§10 待确认 3）：
 * 「浮取 / 中取 / 沉取」是否对应真实加压过程、单次测量总时长，均以硬件协议为准。
 * 阶段表集中在此，调整时不影响 UI 与数据管线。
 */

export type MeasurementStage = 'calibrating' | 'floating' | 'middle' | 'sinking' | 'analyzing';

export interface StageSpec {
  key: MeasurementStage;
  label: string;
  /** 该阶段计划时长（秒） */
  durationSec: number;
}

/** 阶段表：校准 → 浮取 → 中取 → 沉取 → 分析，合计约 75s（§4.2.2「约 60–90s」）。 */
export const STAGES: readonly StageSpec[] = [
  { key: 'calibrating', label: '校准', durationSec: 8 },
  { key: 'floating', label: '浮取', durationSec: 20 },
  { key: 'middle', label: '中取', durationSec: 20 },
  { key: 'sinking', label: '沉取', durationSec: 20 },
  { key: 'analyzing', label: '分析', durationSec: 7 },
] as const;

export const TOTAL_DURATION_SEC = STAGES.reduce((sum, stage) => sum + stage.durationSec, 0);

/** 信号差持续多久后弹出佩戴提示（§4.2.2：差时 5s 后提示）。 */
export const POOR_SIGNAL_HINT_DELAY_MS = 5000;

export interface StageProgress {
  stage: MeasurementStage;
  stageLabel: string;
  /** 当前是第几阶段（1 起） */
  stageIndex: number;
  stageCount: number;
  /** 当前阶段内进度 0–1 */
  stageProgress: number;
  /** 总进度 0–1 */
  totalProgress: number;
  /** 预计剩余秒数 */
  remainingSec: number;
  /** 是否已完成全部阶段 */
  completed: boolean;
}

/**
 * 阶段推进器。
 *
 * 关键行为：**信号差时不推进**（§4.2.2）——
 * `advance()` 只接受「有效经过时间」，信号差的那段时间不计入，
 * 保证采集到的每个阶段都有足够的有效数据。
 */
export class StageMachine {
  /** 已累计的有效测量时间（毫秒） */
  private elapsedMs = 0;
  /** 信号持续差的累计时间，用于触发佩戴提示 */
  private poorSignalMs = 0;

  constructor(private readonly stages: readonly StageSpec[] = STAGES) {
    if (stages.length === 0) throw new RangeError('阶段表不能为空');
  }

  /**
   * 推进测量。
   *
   * @param deltaMs 距上次调用经过的真实时间
   * @param signalOk 当前信号是否允许推进（由 SignalQuality.shouldAdvance 决定）
   */
  advance(deltaMs: number, signalOk: boolean): void {
    if (deltaMs <= 0) return;

    if (signalOk) {
      this.elapsedMs += deltaMs;
      this.poorSignalMs = 0;
    } else {
      // 信号差：进度暂停，但累计「差」的时长以便触发提示
      this.poorSignalMs += deltaMs;
    }
  }

  /** 信号已连续差超过阈值 —— 应弹出佩戴提示（§4.2.2）。 */
  get shouldShowWearHint(): boolean {
    return this.poorSignalMs >= POOR_SIGNAL_HINT_DELAY_MS;
  }

  get poorSignalDurationMs(): number {
    return this.poorSignalMs;
  }

  /** 当前进度快照。 */
  get progress(): StageProgress {
    const totalMs = this.stages.reduce((sum, stage) => sum + stage.durationSec, 0) * 1000;
    const elapsed = Math.min(this.elapsedMs, totalMs);

    let consumed = 0;
    for (let index = 0; index < this.stages.length; index += 1) {
      const stage = this.stages[index] as StageSpec;
      const stageMs = stage.durationSec * 1000;

      if (elapsed < consumed + stageMs || index === this.stages.length - 1) {
        const withinStage = Math.min(Math.max(elapsed - consumed, 0), stageMs);
        const completed = elapsed >= totalMs;

        return {
          stage: stage.key,
          stageLabel: stage.label,
          stageIndex: index + 1,
          stageCount: this.stages.length,
          stageProgress: stageMs === 0 ? 1 : withinStage / stageMs,
          totalProgress: totalMs === 0 ? 1 : elapsed / totalMs,
          remainingSec: Math.max(0, Math.ceil((totalMs - elapsed) / 1000)),
          completed,
        };
      }
      consumed += stageMs;
    }

    // 理论上不可达；保底返回最后一个阶段
    const last = this.stages[this.stages.length - 1] as StageSpec;
    return {
      stage: last.key,
      stageLabel: last.label,
      stageIndex: this.stages.length,
      stageCount: this.stages.length,
      stageProgress: 1,
      totalProgress: 1,
      remainingSec: 0,
      completed: true,
    };
  }

  reset(): void {
    this.elapsedMs = 0;
    this.poorSignalMs = 0;
  }
}
