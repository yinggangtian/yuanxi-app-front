import {
  describeQuality,
  gradeFromScore,
  GRADE_THRESHOLD,
  SignalQualityEngine,
} from '../SignalQuality';

/** 生成一段合成脉搏波。 */
function pulseWave(count: number, amplitude = 0.8, noise = 0, sampleRate = 200): number[] {
  const beatPeriod = (60 / 72) * sampleRate;
  return Array.from({ length: count }, (_, index) => {
    const t = (index % beatPeriod) / beatPeriod;
    const systolic = Math.exp(-(((t - 0.18) / 0.08) ** 2));
    const value = systolic * amplitude;
    return noise === 0 ? value : value + (Math.random() - 0.5) * 2 * noise;
  });
}

describe('gradeFromScore（§4.2.2 三档阈值）', () => {
  it('80 分及以上为优', () => {
    expect(gradeFromScore(100)).toBe('good');
    expect(gradeFromScore(GRADE_THRESHOLD.good)).toBe('good');
  });

  it('50–79 为良', () => {
    expect(gradeFromScore(79)).toBe('fair');
    expect(gradeFromScore(GRADE_THRESHOLD.fair)).toBe('fair');
  });

  it('50 以下为差', () => {
    expect(gradeFromScore(49)).toBe('poor');
    expect(gradeFromScore(0)).toBe('poor');
  });
});

describe('describeQuality', () => {
  it('优 / 良正常推进进度，差则暂停（§4.2.2）', () => {
    expect(describeQuality(90).shouldAdvance).toBe(true);
    expect(describeQuality(60).shouldAdvance).toBe(true);
    expect(describeQuality(20).shouldAdvance).toBe(false);
  });

  it('每一档都有文案，不只靠颜色表达', () => {
    expect(describeQuality(90).message).toBe('信号良好');
    expect(describeQuality(60).message).toBe('信号一般，请保持静止');
    expect(describeQuality(20).message).toBe('接触不良，请调整佩戴');
  });

  it('差档带具体原因时给出可操作指引，而非笼统提示', () => {
    expect(describeQuality(20, 'loose').message).toContain('过松');
    expect(describeQuality(20, 'motion').message).toContain('晃动');
    expect(describeQuality(20, 'contact').message).toContain('腕骨');
  });

  it('非差档不携带原因', () => {
    expect(describeQuality(90, 'loose').reason).toBeNull();
  });

  it('分数越界被夹取，NaN 退化为 0', () => {
    expect(describeQuality(150).score).toBe(100);
    expect(describeQuality(-20).score).toBe(0);
    expect(describeQuality(Number.NaN).score).toBe(0);
  });
});

describe('SignalQualityEngine —— 滑窗评估（§5.6）', () => {
  it('样本不足一个窗口时不给出结论', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(pulseWave(50));

    expect(engine.isReady).toBe(false);
    const assessment = engine.assess();
    expect(assessment.message).toBe('正在检测信号…');
    expect(assessment.shouldAdvance).toBe(false);
  });

  it('干净的脉搏波判为优', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(pulseWave(200, 0.8, 0));

    expect(engine.isReady).toBe(true);
    const assessment = engine.assess();
    expect(assessment.grade).toBe('good');
    expect(assessment.shouldAdvance).toBe(true);
  });

  it('幅度过小判为差，并归因为佩戴过松', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(pulseWave(200, 0.05, 0));

    const assessment = engine.assess();
    expect(assessment.grade).toBe('poor');
    expect(assessment.reason).toBe('loose');
  });

  it('强噪声判为差，并归因为接触不良', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(pulseWave(200, 0.8, 0.6));

    const assessment = engine.assess();
    expect(assessment.grade).toBe('poor');
    expect(assessment.reason).toBe('contact');
  });

  it('滑窗只保留最近一个窗口的样本', () => {
    const engine = new SignalQualityEngine(200, 1);
    // 先喂入一段坏信号
    engine.push(pulseWave(200, 0.03, 0));
    expect(engine.assess().grade).toBe('poor');

    // 再喂入一整窗好信号，结论应随之改善
    engine.push(pulseWave(200, 0.8, 0));
    expect(engine.assess().grade).toBe('good');
  });

  it('全零信号判为差而不是崩溃', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(new Array(200).fill(0));

    const assessment = engine.assess();
    expect(assessment.grade).toBe('poor');
    expect(Number.isNaN(assessment.score)).toBe(false);
  });

  it('reset 后重新进入「检测中」', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(pulseWave(200));
    expect(engine.isReady).toBe(true);

    engine.reset();
    expect(engine.isReady).toBe(false);
  });

  it('支持 Float32Array 输入', () => {
    const engine = new SignalQualityEngine(200, 1);
    engine.push(Float32Array.from(pulseWave(200, 0.8, 0)));

    expect(engine.assess().grade).toBe('good');
  });
});
