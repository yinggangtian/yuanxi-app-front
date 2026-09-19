/**
 * 信号质量引擎（设计文档 §4.2.2 / §5.6）。
 *
 * ⚠️ 归属待确认（§10 待确认 4）：信号质量最终可能由设备端计算。
 * 本模块是 **App 端的判定与展示逻辑**，若改由设备端下发分数，
 * 只需保留 `gradeFromScore` / `describeQuality`，替换 `SignalQualityEngine` 的打分部分。
 */

export type SignalGrade = 'good' | 'fair' | 'poor';

/** 分档阈值（§4.2.2 表格）。 */
export const GRADE_THRESHOLD = { good: 80, fair: 50 } as const;

/** 分数 → 等级。 */
export function gradeFromScore(score: number): SignalGrade {
  if (score >= GRADE_THRESHOLD.good) return 'good';
  if (score >= GRADE_THRESHOLD.fair) return 'fair';
  return 'poor';
}

/** 信号差的可能原因 —— 必须给出**具体**原因，而不是笼统的「信号差」（§4.2.2）。 */
export type PoorReason = 'loose' | 'motion' | 'contact';

export interface QualityAssessment {
  /** 0–100 */
  score: number;
  grade: SignalGrade;
  /** grade 为 poor 时给出推断原因 */
  reason: PoorReason | null;
  /** 面向用户的文案 */
  message: string;
  /** 进度是否应继续推进（§4.2.2：差时暂停推进） */
  shouldAdvance: boolean;
}

/** 各档文案（§4.2.2）。 */
const GRADE_MESSAGE: Record<SignalGrade, string> = {
  good: '信号良好',
  fair: '信号一般，请保持静止',
  poor: '接触不良，请调整佩戴',
};

const REASON_MESSAGE: Record<PoorReason, string> = {
  loose: '佩戴过松，请适当收紧后重新贴合',
  motion: '检测到手腕晃动，请保持静坐',
  contact: '传感器接触不良，请将设备向腕骨方向移动',
};

/** 由分数与原因组装完整判定结果。 */
export function describeQuality(score: number, reason: PoorReason | null = null): QualityAssessment {
  const clamped = Math.max(0, Math.min(100, Number.isNaN(score) ? 0 : score));
  const grade = gradeFromScore(clamped);

  return {
    score: Math.round(clamped),
    grade,
    reason: grade === 'poor' ? reason : null,
    message: grade === 'poor' && reason ? REASON_MESSAGE[reason] : GRADE_MESSAGE[grade],
    // 只有「差」才暂停推进；「良」仍正常推进（§4.2.2）
    shouldAdvance: grade !== 'poor',
  };
}

/**
 * 信号质量引擎：1s 滑窗统计（§5.6）。
 *
 * 打分依据三个可从原始波形直接观测的维度：
 * 1. **幅度** —— 过小说明贴合不足或佩戴过松
 * 2. **信噪比** —— 高频抖动占比过大说明接触不良或运动干扰
 * 3. **基线稳定性** —— 基线大幅漂移说明手腕在动
 *
 * 真实算法由算法组提供（§10 待确认 4），此处是可用且可解释的前端实现，
 * 保证 UI 链路在算法就位前即可完整联调。
 */
export class SignalQualityEngine {
  private window: number[] = [];
  private readonly windowSize: number;

  constructor(sampleRate = 200, windowSeconds = 1) {
    this.windowSize = Math.max(1, Math.round(sampleRate * windowSeconds));
  }

  /** 喂入一批样本。 */
  push(samples: ArrayLike<number>): void {
    for (let index = 0; index < samples.length; index += 1) {
      this.window.push(samples[index] as number);
    }
    if (this.window.length > this.windowSize) {
      this.window = this.window.slice(this.window.length - this.windowSize);
    }
  }

  /** 样本是否已够一个完整窗口 —— 不足时不应对外给出质量结论。 */
  get isReady(): boolean {
    return this.window.length >= this.windowSize;
  }

  /** 评估当前窗口。样本不足时按「检测中」返回 0 分。 */
  assess(): QualityAssessment {
    if (!this.isReady) {
      return {
        score: 0,
        grade: 'poor',
        reason: null,
        message: '正在检测信号…',
        shouldAdvance: false,
      };
    }

    const values = this.window;
    const count = values.length;

    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
      sum += value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    const mean = sum / count;

    // 1. 幅度（峰峰值）
    const amplitude = max - min;

    // 2. 高频抖动：相邻样本差分的均方根
    let diffSquareSum = 0;
    for (let index = 1; index < count; index += 1) {
      const delta = (values[index] as number) - (values[index - 1] as number);
      diffSquareSum += delta * delta;
    }
    const jitter = Math.sqrt(diffSquareSum / Math.max(1, count - 1));

    // 3. 基线漂移：窗口前后半段均值之差
    const half = Math.floor(count / 2);
    let firstHalfSum = 0;
    let secondHalfSum = 0;
    for (let index = 0; index < half; index += 1) firstHalfSum += values[index] as number;
    for (let index = half; index < count; index += 1) secondHalfSum += values[index] as number;
    const drift = Math.abs(firstHalfSum / Math.max(1, half) - secondHalfSum / Math.max(1, count - half));

    // 各维度打分（0–1）
    // 幅度：脉搏波峰峰值低于 0.2 判定为贴合不足
    const amplitudeScore = clamp01(amplitude / 0.6);
    // 抖动：相对于幅度衡量，避免大信号被误判。
    // 分母 0.25 对应「相邻样本差分 RMS 达到峰峰值的 25% 即判定不可用」——
    // 此时信噪比已接近 1，脉搏特征无法提取。
    const relativeJitter = amplitude > 0 ? jitter / amplitude : 1;
    const jitterScore = clamp01(1 - relativeJitter / 0.25);
    const driftScore = clamp01(1 - drift / 0.5);

    // 幅度作为**乘性门控**而非加权项：几乎没有脉搏信号时，
    // 波形再「干净」也无法测量，不能靠低抖动把总分拉回「良」。
    const cleanliness = jitterScore * 0.55 + driftScore * 0.45;
    const score = amplitudeScore * cleanliness * 100;

    // 推断最主要的问题，给出可操作的具体指引
    let reason: PoorReason | null = null;
    if (gradeFromScore(score) === 'poor') {
      const worst = Math.min(amplitudeScore, jitterScore, driftScore);
      if (worst === amplitudeScore) reason = 'loose';
      else if (worst === jitterScore) reason = 'contact';
      else reason = 'motion';
    }

    void mean;
    return describeQuality(score, reason);
  }

  reset(): void {
    this.window = [];
  }
}

const clamp01 = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
};
