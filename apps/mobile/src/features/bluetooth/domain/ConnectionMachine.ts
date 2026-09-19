/**
 * BLE 连接状态机（设计文档 §5.5.2）。
 *
 * ```text
 * idle ──scan()──► scanning ──found──► discovered ──connect()──► connecting
 *   └──connect(lastDeviceId)──────────────────────────────────────────┘  自动回连（§4.2.1）
 *   ▲                                                                │ GATT ready
 *   │                                                                ▼
 *   └──disconnect()────────────── ready ◄──stop()── measuring ◄──start()
 *                                   │ link lost
 *                                   ▼
 *                              reconnecting ──(重试 3 次后)──► idle
 * ```
 *
 * 手写 reducer 实现：状态迁移全部可枚举、可单测，不引入额外依赖。
 */

export type ConnectionState =
  | 'idle'
  | 'scanning'
  | 'discovered'
  | 'connecting'
  | 'ready'
  | 'measuring'
  | 'reconnecting';

export type ConnectionEvent =
  | { type: 'SCAN' }
  | { type: 'FOUND' }
  | { type: 'SCAN_TIMEOUT' }
  | { type: 'CONNECT' }
  | { type: 'GATT_READY' }
  | { type: 'CONNECT_FAILED' }
  | { type: 'START_MEASURE' }
  | { type: 'STOP_MEASURE' }
  | { type: 'LINK_LOST' }
  | { type: 'RECONNECTED' }
  | { type: 'RETRY_EXHAUSTED' }
  | { type: 'DISCONNECT' };

export interface MachineContext {
  state: ConnectionState;
  /** 当前重连已尝试次数 */
  retryCount: number;
  /**
   * 断链前是否处于测量中 —— 决定重连成功后回到 measuring 还是 ready。
   * 测量中断开需要保留这一信息，否则重连后会丢失测量上下文（§3.4）。
   */
  wasMeasuring: boolean;
}

/** 重连最大尝试次数（§5.5.2）。 */
export const MAX_RECONNECT_ATTEMPTS = 3;

/** 指数退避：1s, 2s, 4s（§5.5.2）。 */
export function reconnectDelayMs(attempt: number): number {
  return 1000 * 2 ** Math.max(0, attempt);
}

/** 测量中断开的最长等待时间（§3.4：自动重连 10s）。 */
export const MEASURING_RECONNECT_WINDOW_MS = 10_000;

export const initialContext: MachineContext = {
  state: 'idle',
  retryCount: 0,
  wasMeasuring: false,
};

/**
 * 状态迁移。未定义的迁移**保持原状态不变**（而非抛错）——
 * BLE 事件可能乱序到达，崩溃比忽略代价更大。
 */
export function transition(context: MachineContext, event: ConnectionEvent): MachineContext {
  const { state } = context;

  // 任何状态下都可主动断开
  if (event.type === 'DISCONNECT') {
    return { state: 'idle', retryCount: 0, wasMeasuring: false };
  }

  // 任何已连接状态下的断链都进入重连
  if (event.type === 'LINK_LOST') {
    if (state === 'ready' || state === 'measuring') {
      return { state: 'reconnecting', retryCount: 0, wasMeasuring: state === 'measuring' };
    }
    return context;
  }

  switch (state) {
    case 'idle':
      if (event.type === 'SCAN') return { ...context, state: 'scanning', retryCount: 0 };
      // 「设备自动回连」（§4.2.1）：已知 lastDeviceId 时直接连接，无需先扫描
      if (event.type === 'CONNECT') return { ...context, state: 'connecting', retryCount: 0 };
      return context;

    case 'scanning':
      if (event.type === 'FOUND') return { ...context, state: 'discovered' };
      if (event.type === 'SCAN_TIMEOUT') return { ...context, state: 'idle' };
      // 已知设备可跳过 discovered 直接回连
      if (event.type === 'CONNECT') return { ...context, state: 'connecting' };
      return context;

    case 'discovered':
      if (event.type === 'CONNECT') return { ...context, state: 'connecting' };
      if (event.type === 'SCAN') return { ...context, state: 'scanning' };
      return context;

    case 'connecting':
      if (event.type === 'GATT_READY') return { ...context, state: 'ready', retryCount: 0 };
      if (event.type === 'CONNECT_FAILED') return { ...context, state: 'idle' };
      return context;

    case 'ready':
      if (event.type === 'START_MEASURE') return { ...context, state: 'measuring' };
      return context;

    case 'measuring':
      if (event.type === 'STOP_MEASURE') return { ...context, state: 'ready' };
      return context;

    case 'reconnecting':
      if (event.type === 'RECONNECTED') {
        // 断链前在测量中则回到 measuring，保住测量上下文
        return {
          state: context.wasMeasuring ? 'measuring' : 'ready',
          retryCount: 0,
          wasMeasuring: false,
        };
      }
      if (event.type === 'CONNECT_FAILED') {
        const retryCount = context.retryCount + 1;
        if (retryCount >= MAX_RECONNECT_ATTEMPTS) {
          return { state: 'idle', retryCount: 0, wasMeasuring: false };
        }
        return { ...context, retryCount };
      }
      if (event.type === 'RETRY_EXHAUSTED') {
        return { state: 'idle', retryCount: 0, wasMeasuring: false };
      }
      return context;

    default:
      return context;
  }
}

/** 当前是否处于「已连上设备」的状态。 */
export function isConnected(state: ConnectionState): boolean {
  return state === 'ready' || state === 'measuring';
}

/** 是否允许发起测量。 */
export function canStartMeasurement(state: ConnectionState): boolean {
  return state === 'ready';
}
