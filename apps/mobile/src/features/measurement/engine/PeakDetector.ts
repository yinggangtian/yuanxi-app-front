/**
 * 峰值检测 → 实时脉率（设计文档 §5.6）。
 *
 * 采用「自适应阈值 + 不应期」策略：
 * - 阈值取近窗最大值的一定比例，适应幅度漂移
 * - 不应期（最短心搏间隔）过滤重搏波与噪声造成的假峰
 *
 * 实时脉率以 1Hz 更新，不随每个样本抖动（§5.6）。
 */

/** 生理上限 200bpm → 最短心搏间隔 300ms。 */
export const MIN_BEAT_INTERVAL_MS = 300;
/** 生理下限 30bpm → 最长有效间隔 2000ms。 */
export const MAX_BEAT_INTERVAL_MS = 2000;

export class PeakDetector {
  /** 最近若干个心搏间隔（毫秒），取中位数抗异常值 */
  private intervals: number[] = [];
  private lastPeakTimeMs: number | null = null;
  private previousValue = 0;
  private rising = false;

  /** 近窗最大/最小值，用于自适应阈值 */
  private windowMax = -Infinity;
  private windowMin = Infinity;
  private sampleCount = 0;

  constructor(
    private readonly sampleRate = 200,
    /** 保留多少个心搏间隔参与中位数计算 */
    private readonly historySize = 8,
  ) {}

  /**
   * 喂入一批样本。
   * @param startTimeMs 该批首样本的时间戳
   */
  push(samples: ArrayLike<number>, startTimeMs: number): void {
    const sampleIntervalMs = 1000 / this.sampleRate;

    for (let index = 0; index < samples.length; index += 1) {
      const value = samples[index] as number;
      const timeMs = startTimeMs + index * sampleIntervalMs;

      // 滑动更新极值（简化：按样本数衰减，保持对幅度变化的跟随）
      this.sampleCount += 1;
      if (value > this.windowMax) this.windowMax = value;
      if (value < this.windowMin) this.windowMin = value;
      if (this.sampleCount % (this.sampleRate * 2) === 0) {
        // 每 2s 松弛一次，避免一次性异常值长期抬高阈值
        const mid = (this.windowMax + this.windowMin) / 2;
        this.windowMax = mid + (this.windowMax - mid) * 0.7;
        this.windowMin = mid + (this.windowMin - mid) * 0.7;
      }

      const amplitude = this.windowMax - this.windowMin;
      // 幅度过小说明没有有效脉搏，不做检测
      if (amplitude < 0.05) {
        this.previousValue = value;
        continue;
      }

      // 阈值取峰峰值的 60%
      const threshold = this.windowMin + amplitude * 0.6;

      if (value > threshold && value > this.previousValue) {
        this.rising = true;
      } else if (this.rising && value < this.previousValue) {
        // 由升转降 → 刚越过一个峰
        this.rising = false;
        this.registerPeak(timeMs);
      }

      this.previousValue = value;
    }
  }

  private registerPeak(timeMs: number): void {
    if (this.lastPeakTimeMs !== null) {
      const interval = timeMs - this.lastPeakTimeMs;
      // 不应期内的峰视为重搏波 / 噪声，丢弃且不更新 lastPeak
      if (interval < MIN_BEAT_INTERVAL_MS) return;

      if (interval <= MAX_BEAT_INTERVAL_MS) {
        this.intervals.push(interval);
        if (this.intervals.length > this.historySize) this.intervals.shift();
      } else {
        // 间隔过长说明中间漏检，历史不再连续，清空重新累积
        this.intervals = [];
      }
    }
    this.lastPeakTimeMs = timeMs;
  }

  /**
   * 当前脉率（次/分）。样本不足以给出稳定结论时返回 null
   * —— UI 应显示「--」而不是一个跳动的假数字。
   */
  get bpm(): number | null {
    if (this.intervals.length < 2) return null;

    const sorted = [...this.intervals].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
        : (sorted[middle] as number);

    if (median <= 0) return null;
    return Math.round(60_000 / median);
  }

  /** 已检出的有效心搏间隔数量。 */
  get beatCount(): number {
    return this.intervals.length;
  }

  reset(): void {
    this.intervals = [];
    this.lastPeakTimeMs = null;
    this.previousValue = 0;
    this.rising = false;
    this.windowMax = -Infinity;
    this.windowMin = Infinity;
    this.sampleCount = 0;
  }
}
