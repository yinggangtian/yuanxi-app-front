import {
  canStartMeasurement,
  initialContext,
  isConnected,
  MAX_RECONNECT_ATTEMPTS,
  reconnectDelayMs,
  transition,
  type ConnectionEvent,
  type MachineContext,
} from '../ConnectionMachine';

/** 依次施加事件，返回最终上下文。 */
function run(events: ConnectionEvent[], from: MachineContext = initialContext): MachineContext {
  return events.reduce(transition, from);
}

const CONNECTED: ConnectionEvent[] = [
  { type: 'SCAN' },
  { type: 'FOUND' },
  { type: 'CONNECT' },
  { type: 'GATT_READY' },
];

describe('连接状态机 —— 主链路（§5.5.2）', () => {
  it('扫描 → 发现 → 连接 → 就绪', () => {
    expect(run([{ type: 'SCAN' }]).state).toBe('scanning');
    expect(run([{ type: 'SCAN' }, { type: 'FOUND' }]).state).toBe('discovered');
    expect(run([{ type: 'SCAN' }, { type: 'FOUND' }, { type: 'CONNECT' }]).state).toBe('connecting');
    expect(run(CONNECTED).state).toBe('ready');
  });

  it('就绪后可开始与停止测量', () => {
    expect(run([...CONNECTED, { type: 'START_MEASURE' }]).state).toBe('measuring');
    expect(run([...CONNECTED, { type: 'START_MEASURE' }, { type: 'STOP_MEASURE' }]).state).toBe(
      'ready',
    );
  });

  it('已知设备可跳过 discovered 直接回连', () => {
    expect(run([{ type: 'SCAN' }, { type: 'CONNECT' }]).state).toBe('connecting');
  });

  it('idle 下可直接回连已知设备，无需先扫描（§4.2.1 设备自动回连）', () => {
    const context = run([{ type: 'CONNECT' }]);
    expect(context.state).toBe('connecting');
    expect(run([{ type: 'CONNECT' }, { type: 'GATT_READY' }]).state).toBe('ready');
  });

  it('扫描超时回到 idle', () => {
    expect(run([{ type: 'SCAN' }, { type: 'SCAN_TIMEOUT' }]).state).toBe('idle');
  });

  it('连接失败回到 idle', () => {
    expect(run([{ type: 'SCAN' }, { type: 'FOUND' }, { type: 'CONNECT' }, { type: 'CONNECT_FAILED' }]).state).toBe(
      'idle',
    );
  });
});

describe('连接状态机 —— 断链与重连', () => {
  it('就绪中断链进入重连', () => {
    const context = run([...CONNECTED, { type: 'LINK_LOST' }]);
    expect(context.state).toBe('reconnecting');
    expect(context.wasMeasuring).toBe(false);
  });

  it('测量中断链保留测量上下文，重连后回到 measuring（§3.4）', () => {
    const lost = run([...CONNECTED, { type: 'START_MEASURE' }, { type: 'LINK_LOST' }]);
    expect(lost.state).toBe('reconnecting');
    expect(lost.wasMeasuring).toBe(true);

    const recovered = transition(lost, { type: 'RECONNECTED' });
    expect(recovered.state).toBe('measuring');
    expect(recovered.wasMeasuring).toBe(false);
  });

  it('非测量中断链，重连后回到 ready', () => {
    const recovered = run([...CONNECTED, { type: 'LINK_LOST' }, { type: 'RECONNECTED' }]);
    expect(recovered.state).toBe('ready');
  });

  it('重连失败累加计数，达到上限后回到 idle', () => {
    let context = run([...CONNECTED, { type: 'LINK_LOST' }]);

    for (let attempt = 1; attempt < MAX_RECONNECT_ATTEMPTS; attempt += 1) {
      context = transition(context, { type: 'CONNECT_FAILED' });
      expect(context.state).toBe('reconnecting');
      expect(context.retryCount).toBe(attempt);
    }

    context = transition(context, { type: 'CONNECT_FAILED' });
    expect(context.state).toBe('idle');
    expect(context.retryCount).toBe(0);
  });

  it('RETRY_EXHAUSTED 直接回到 idle 并清空测量标记', () => {
    const context = run([
      ...CONNECTED,
      { type: 'START_MEASURE' },
      { type: 'LINK_LOST' },
      { type: 'RETRY_EXHAUSTED' },
    ]);
    expect(context.state).toBe('idle');
    expect(context.wasMeasuring).toBe(false);
  });

  it('未连接状态下的断链事件被忽略', () => {
    expect(run([{ type: 'SCAN' }, { type: 'LINK_LOST' }]).state).toBe('scanning');
    expect(transition(initialContext, { type: 'LINK_LOST' }).state).toBe('idle');
  });
});

describe('连接状态机 —— 健壮性', () => {
  it('任何状态都能主动断开', () => {
    const states: ConnectionEvent[][] = [
      [{ type: 'SCAN' }],
      [{ type: 'SCAN' }, { type: 'FOUND' }],
      CONNECTED,
      [...CONNECTED, { type: 'START_MEASURE' }],
      [...CONNECTED, { type: 'LINK_LOST' }],
    ];

    for (const events of states) {
      expect(run([...events, { type: 'DISCONNECT' }]).state).toBe('idle');
    }
  });

  it('未定义的迁移保持原状态，不抛错（BLE 事件可能乱序）', () => {
    const ready = run(CONNECTED);
    expect(transition(ready, { type: 'FOUND' }).state).toBe('ready');
    expect(transition(ready, { type: 'GATT_READY' }).state).toBe('ready');
    expect(transition(initialContext, { type: 'START_MEASURE' }).state).toBe('idle');
    expect(transition(initialContext, { type: 'RECONNECTED' }).state).toBe('idle');
  });

  it('idle 状态重复 DISCONNECT 幂等', () => {
    expect(run([{ type: 'DISCONNECT' }, { type: 'DISCONNECT' }]).state).toBe('idle');
  });

  it('discovered 下可重新发起扫描（「不是这台？重新搜索」§7.7）', () => {
    expect(run([{ type: 'SCAN' }, { type: 'FOUND' }, { type: 'SCAN' }]).state).toBe('scanning');
  });

  it('每个状态对无关事件都保持不变', () => {
    const noop: Record<string, ConnectionEvent> = {
      scanning: { type: 'STOP_MEASURE' },
      discovered: { type: 'GATT_READY' },
      connecting: { type: 'FOUND' },
      ready: { type: 'CONNECT' },
      measuring: { type: 'START_MEASURE' },
      reconnecting: { type: 'SCAN' },
    };

    const reach: Record<string, ConnectionEvent[]> = {
      scanning: [{ type: 'SCAN' }],
      discovered: [{ type: 'SCAN' }, { type: 'FOUND' }],
      connecting: [{ type: 'CONNECT' }],
      ready: CONNECTED,
      measuring: [...CONNECTED, { type: 'START_MEASURE' }],
      reconnecting: [...CONNECTED, { type: 'LINK_LOST' }],
    };

    for (const [state, events] of Object.entries(reach)) {
      const context = run(events);
      expect(context.state).toBe(state);
      expect(transition(context, noop[state]!).state).toBe(state);
    }
  });

  it('connecting 中断链不进重连（尚未建立过连接）', () => {
    expect(run([{ type: 'CONNECT' }, { type: 'LINK_LOST' }]).state).toBe('connecting');
  });
});

describe('重连退避与状态判定', () => {
  it('指数退避 1s / 2s / 4s（§5.5.2）', () => {
    expect(reconnectDelayMs(0)).toBe(1000);
    expect(reconnectDelayMs(1)).toBe(2000);
    expect(reconnectDelayMs(2)).toBe(4000);
  });

  it('负数尝试次数不产生小于 1s 的延迟', () => {
    expect(reconnectDelayMs(-1)).toBe(1000);
  });

  it('isConnected 只在 ready / measuring 为真', () => {
    expect(isConnected('ready')).toBe(true);
    expect(isConnected('measuring')).toBe(true);
    expect(isConnected('reconnecting')).toBe(false);
    expect(isConnected('idle')).toBe(false);
  });

  it('只有 ready 允许开始测量', () => {
    expect(canStartMeasurement('ready')).toBe(true);
    expect(canStartMeasurement('measuring')).toBe(false);
    expect(canStartMeasurement('reconnecting')).toBe(false);
  });
});
