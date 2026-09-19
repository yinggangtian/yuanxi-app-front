import {
  POOR_SIGNAL_HINT_DELAY_MS,
  STAGES,
  StageMachine,
  TOTAL_DURATION_SEC,
} from '../StageMachine';

describe('阶段表（§4.2.2）', () => {
  it('按「校准 → 浮取 → 中取 → 沉取 → 分析」排列', () => {
    expect(STAGES.map((stage) => stage.key)).toEqual([
      'calibrating',
      'floating',
      'middle',
      'sinking',
      'analyzing',
    ]);
  });

  it('总时长落在「约 60–90 秒」区间内', () => {
    expect(TOTAL_DURATION_SEC).toBeGreaterThanOrEqual(60);
    expect(TOTAL_DURATION_SEC).toBeLessThanOrEqual(90);
  });

  it('空阶段表被拒绝', () => {
    expect(() => new StageMachine([])).toThrow(RangeError);
  });
});

describe('StageMachine —— 推进', () => {
  it('初始处于第一阶段，进度为 0', () => {
    const machine = new StageMachine();
    const progress = machine.progress;

    expect(progress.stage).toBe('calibrating');
    expect(progress.stageIndex).toBe(1);
    expect(progress.stageCount).toBe(STAGES.length);
    expect(progress.totalProgress).toBe(0);
    expect(progress.completed).toBe(false);
    expect(progress.remainingSec).toBe(TOTAL_DURATION_SEC);
  });

  it('信号良好时按真实时间推进', () => {
    const machine = new StageMachine();
    machine.advance(4000, true);

    const progress = machine.progress;
    expect(progress.stage).toBe('calibrating');
    // 校准阶段 8s，已过 4s
    expect(progress.stageProgress).toBeCloseTo(0.5, 2);
  });

  it('跨阶段推进后进入下一阶段', () => {
    const machine = new StageMachine();
    machine.advance(10_000, true); // 超过校准 8s

    const progress = machine.progress;
    expect(progress.stage).toBe('floating');
    expect(progress.stageIndex).toBe(2);
    expect(progress.stageProgress).toBeCloseTo(0.1, 2);
  });

  it('走完全程标记为完成', () => {
    const machine = new StageMachine();
    machine.advance(TOTAL_DURATION_SEC * 1000, true);

    const progress = machine.progress;
    expect(progress.completed).toBe(true);
    expect(progress.totalProgress).toBe(1);
    expect(progress.remainingSec).toBe(0);
    expect(progress.stage).toBe('analyzing');
  });

  it('超时推进不会让进度越界', () => {
    const machine = new StageMachine();
    machine.advance(TOTAL_DURATION_SEC * 1000 * 3, true);

    expect(machine.progress.totalProgress).toBe(1);
    expect(machine.progress.stageProgress).toBeLessThanOrEqual(1);
  });

  it('非正的时间增量被忽略', () => {
    const machine = new StageMachine();
    machine.advance(0, true);
    machine.advance(-1000, true);

    expect(machine.progress.totalProgress).toBe(0);
  });
});

describe('StageMachine —— 信号差暂停（§4.2.2）', () => {
  it('信号差时进度不推进', () => {
    const machine = new StageMachine();
    machine.advance(4000, true);
    const before = machine.progress.totalProgress;

    machine.advance(5000, false);
    expect(machine.progress.totalProgress).toBe(before);
  });

  it('信号差累计达阈值后提示调整佩戴', () => {
    const machine = new StageMachine();

    machine.advance(POOR_SIGNAL_HINT_DELAY_MS - 1, false);
    expect(machine.shouldShowWearHint).toBe(false);

    machine.advance(1, false);
    expect(machine.shouldShowWearHint).toBe(true);
  });

  it('信号恢复后清零「差」计时，提示随之消失', () => {
    const machine = new StageMachine();
    machine.advance(POOR_SIGNAL_HINT_DELAY_MS, false);
    expect(machine.shouldShowWearHint).toBe(true);

    machine.advance(100, true);
    expect(machine.shouldShowWearHint).toBe(false);
    expect(machine.poorSignalDurationMs).toBe(0);
  });

  it('断续的差信号不累加成误报', () => {
    const machine = new StageMachine();
    for (let round = 0; round < 5; round += 1) {
      machine.advance(2000, false);
      machine.advance(500, true); // 恢复一次即清零
    }
    expect(machine.shouldShowWearHint).toBe(false);
  });

  it('全程信号差则永远无法完成 —— 保证每阶段都有足够有效数据', () => {
    const machine = new StageMachine();
    machine.advance(TOTAL_DURATION_SEC * 1000 * 2, false);

    expect(machine.progress.completed).toBe(false);
    expect(machine.progress.totalProgress).toBe(0);
  });
});

describe('StageMachine —— 重置', () => {
  it('reset 清空进度与差信号计时', () => {
    const machine = new StageMachine();
    machine.advance(20_000, true);
    machine.advance(POOR_SIGNAL_HINT_DELAY_MS, false);

    machine.reset();

    expect(machine.progress.totalProgress).toBe(0);
    expect(machine.progress.stage).toBe('calibrating');
    expect(machine.shouldShowWearHint).toBe(false);
  });
});

describe('StageMachine —— 自定义阶段表', () => {
  it('支持硬件协议确定后替换阶段定义（§10 待确认 3）', () => {
    const machine = new StageMachine([
      { key: 'calibrating', label: '校准', durationSec: 2 },
      { key: 'analyzing', label: '分析', durationSec: 2 },
    ]);

    machine.advance(2500, true);
    const progress = machine.progress;

    expect(progress.stageCount).toBe(2);
    expect(progress.stage).toBe('analyzing');
  });
});
