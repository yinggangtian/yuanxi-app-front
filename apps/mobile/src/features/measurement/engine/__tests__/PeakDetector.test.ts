import { MIN_BEAT_INTERVAL_MS, PeakDetector } from '../PeakDetector';

const SAMPLE_RATE = 200;

/**
 * 生成含重搏波的合成脉搏波 —— 重搏波是真实脉搏的固有特征，
 * 峰值检测必须**不能**把它算成一次心搏。
 */
function pulseWave(bpm: number, seconds: number, withDicrotic = true): number[] {
  const beatPeriod = (60 / bpm) * SAMPLE_RATE;
  const count = Math.round(SAMPLE_RATE * seconds);

  return Array.from({ length: count }, (_, index) => {
    const t = (index % beatPeriod) / beatPeriod;
    const systolic = Math.exp(-(((t - 0.18) / 0.06) ** 2));
    const dicrotic = withDicrotic ? 0.4 * Math.exp(-(((t - 0.45) / 0.07) ** 2)) : 0;
    return systolic + dicrotic;
  });
}

function feed(detector: PeakDetector, samples: number[], startMs = 0): void {
  const batchSize = 8; // 与 §5.6 的 40ms @200Hz 一致
  for (let offset = 0; offset < samples.length; offset += batchSize) {
    const batch = samples.slice(offset, offset + batchSize);
    detector.push(batch, startMs + (offset / SAMPLE_RATE) * 1000);
  }
}

describe('PeakDetector —— 脉率推算（§5.6）', () => {
  it('样本不足时返回 null，而不是跳动的假数字', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    expect(detector.bpm).toBeNull();

    feed(detector, pulseWave(72, 0.5));
    expect(detector.bpm).toBeNull();
  });

  it('72bpm 波形推算结果接近 72', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    feed(detector, pulseWave(72, 10));

    expect(detector.bpm).not.toBeNull();
    expect(detector.bpm!).toBeGreaterThanOrEqual(69);
    expect(detector.bpm!).toBeLessThanOrEqual(75);
  });

  it('重搏波不被误计为心搏', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    feed(detector, pulseWave(72, 10, true));

    // 若把重搏波算进去，结果会接近 144
    expect(detector.bpm!).toBeLessThan(100);
  });

  it('不同心率都能正确推算', () => {
    for (const bpm of [55, 72, 95, 120]) {
      const detector = new PeakDetector(SAMPLE_RATE);
      feed(detector, pulseWave(bpm, 12));

      expect(detector.bpm).not.toBeNull();
      expect(Math.abs(detector.bpm! - bpm)).toBeLessThanOrEqual(Math.max(4, bpm * 0.06));
    }
  });

  it('不应期常量对应生理上限 200bpm', () => {
    expect(MIN_BEAT_INTERVAL_MS).toBe(300);
    expect(Math.round(60_000 / MIN_BEAT_INTERVAL_MS)).toBe(200);
  });

  it('平直信号不产生任何心搏', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    feed(detector, new Array(SAMPLE_RATE * 5).fill(0));

    expect(detector.bpm).toBeNull();
    expect(detector.beatCount).toBe(0);
  });

  it('幅度极小的信号不触发检测（贴合不足时不该报脉率）', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    feed(detector, pulseWave(72, 5).map((value) => value * 0.01));

    expect(detector.bpm).toBeNull();
  });

  it('reset 后重新开始累积', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    feed(detector, pulseWave(72, 10));
    expect(detector.bpm).not.toBeNull();

    detector.reset();
    expect(detector.bpm).toBeNull();
    expect(detector.beatCount).toBe(0);
  });

  it('支持 Float32Array 输入', () => {
    const detector = new PeakDetector(SAMPLE_RATE);
    const wave = Float32Array.from(pulseWave(72, 10));
    for (let offset = 0; offset < wave.length; offset += 8) {
      detector.push(wave.subarray(offset, offset + 8), (offset / SAMPLE_RATE) * 1000);
    }

    expect(detector.bpm).not.toBeNull();
  });
});
