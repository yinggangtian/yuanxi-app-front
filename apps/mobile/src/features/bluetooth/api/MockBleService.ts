
import type { BleService } from './BleService';
import type {
  BleAdapterState,
  DeviceInfo,
  DiscoveredDevice,
  FirmwareFile,
  MeasurementConfig,
  SampleBatch,
  Unsubscribe,
} from './types';
import { transition, type ConnectionState, type MachineContext } from '../domain/ConnectionMachine';

/**
 * 模拟 BLE 服务（设计文档 §5.5.1 / §5.12）。
 *
 * 用途：模拟器开发、UI 调试、Maestro E2E —— 让「登录→绑定→佩戴→测量→报告」
 * 全链路在没有硬件的情况下可跑、可回归。
 *
 * 生成的是**合成脉搏波**（主峰 + 重搏波 + 呼吸基线漂移 + 噪声），
 * 形态接近真实脉搏，便于验证波形绘制与信号质量逻辑。
 */
export interface MockBleOptions {
  /** 初始适配器状态，便于演练「蓝牙关闭」异常链路（§3.4） */
  adapterState?: BleAdapterState;
  /** 扫描多久后「发现」设备 */
  discoverDelayMs?: number;
  /** 是否模拟扫描不到设备（演练 30s 超时链路） */
  neverDiscover?: boolean;
  /** 连接耗时 */
  connectDelayMs?: number;
  /** 样本批回调间隔，默认 40ms（与 §5.6 一致） */
  batchIntervalMs?: number;
  sampleRate?: number;
  /** 模拟信号质量：'good' 稳定，'poor' 注入大量噪声 */
  signalProfile?: 'good' | 'poor';
}

const DEFAULT_DEVICE: DiscoveredDevice = {
  id: 'mock-device-0001',
  name: '脉搏环 Pro',
  rssi: -58,
  sn: 'YX2026A18F2A',
  model: 'ring-pro',
};

const DEFAULT_INFO: DeviceInfo = {
  sn: 'YX2026A18F2A',
  model: 'ring-pro',
  firmware: 'v1.2.0',
  battery: 82,
};

export class MockBleService implements BleService {
  private context: MachineContext = { state: 'idle', retryCount: 0, wasMeasuring: false };
  private adapterState: BleAdapterState;

  private connectionListeners = new Set<(state: ConnectionState) => void>();
  private adapterListeners = new Set<(state: BleAdapterState) => void>();
  private sampleListeners = new Set<(batch: SampleBatch) => void>();
  private batteryListeners = new Set<(level: number) => void>();

  private sampleTimer: ReturnType<typeof setInterval> | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  /** 合成波形的相位累计，单位为样本数 */
  private phase = 0;

  constructor(private readonly options: MockBleOptions = {}) {
    this.adapterState = options.adapterState ?? 'poweredOn';
  }

  // ── 适配器 ──────────────────────────────────────────────

  async getAdapterState(): Promise<BleAdapterState> {
    return this.adapterState;
  }

  onAdapterStateChange(callback: (state: BleAdapterState) => void): Unsubscribe {
    this.adapterListeners.add(callback);
    return () => this.adapterListeners.delete(callback);
  }

  /** 测试辅助：模拟用户在系统设置里开/关蓝牙。 */
  setAdapterState(state: BleAdapterState): void {
    this.adapterState = state;
    for (const listener of this.adapterListeners) listener(state);
  }

  async requestPermissions(): Promise<boolean> {
    return this.adapterState !== 'unauthorized';
  }

  // ── 扫描与连接 ──────────────────────────────────────────

  scan(options: { timeoutMs: number }, onFound: (device: DiscoveredDevice) => void): Unsubscribe {
    this.dispatch({ type: 'SCAN' });

    if (!this.options.neverDiscover) {
      this.scanTimer = setTimeout(() => {
        this.dispatch({ type: 'FOUND' });
        onFound(DEFAULT_DEVICE);
      }, this.options.discoverDelayMs ?? 1200);
    } else {
      // 演练「30s 未发现设备」链路
      this.scanTimer = setTimeout(() => {
        this.dispatch({ type: 'SCAN_TIMEOUT' });
      }, options.timeoutMs);
    }

    return () => this.clearScanTimer();
  }

  async connect(deviceId: string): Promise<DeviceInfo> {
    this.clearScanTimer();
    this.dispatch({ type: 'CONNECT' });

    await delay(this.options.connectDelayMs ?? 800);

    this.dispatch({ type: 'GATT_READY' });
    for (const listener of this.batteryListeners) listener(DEFAULT_INFO.battery);

    return { ...DEFAULT_INFO, sn: deviceId === DEFAULT_DEVICE.id ? DEFAULT_INFO.sn : deviceId };
  }

  async disconnect(): Promise<void> {
    this.stopSampling();
    this.clearScanTimer();
    this.dispatch({ type: 'DISCONNECT' });
  }

  onConnectionChange(callback: (state: ConnectionState) => void): Unsubscribe {
    this.connectionListeners.add(callback);
    // 立即推送当前状态，避免订阅方错过已发生的迁移
    callback(this.context.state);
    return () => this.connectionListeners.delete(callback);
  }

  /** 测试辅助：模拟链路中断（§3.4 测量中断开）。 */
  simulateLinkLost(): void {
    this.stopSampling();
    this.dispatch({ type: 'LINK_LOST' });
  }

  /** 测试辅助：模拟重连成功。 */
  simulateReconnected(): void {
    this.dispatch({ type: 'RECONNECTED' });
    if (this.context.state === 'measuring') this.startSampling();
  }

  // ── 测量 ────────────────────────────────────────────────

  async startMeasurement(config: MeasurementConfig): Promise<void> {
    this.dispatch({ type: 'START_MEASURE' });
    this.phase = 0;
    this.startSampling(config.sampleRate);
  }

  async stopMeasurement(): Promise<void> {
    this.stopSampling();
    this.dispatch({ type: 'STOP_MEASURE' });
  }

  onSamples(callback: (batch: SampleBatch) => void): Unsubscribe {
    this.sampleListeners.add(callback);
    return () => this.sampleListeners.delete(callback);
  }

  onBattery(callback: (level: number) => void): Unsubscribe {
    this.batteryListeners.add(callback);
    return () => this.batteryListeners.delete(callback);
  }

  async startOta(firmware: FirmwareFile, onProgress: (percent: number) => void): Promise<void> {
    for (let percent = 0; percent <= 100; percent += 5) {
      onProgress(percent);
      await delay(80);
    }
  }

  /** 释放全部定时器与监听 —— 组件卸载时必须调用，避免测试之间互相干扰。 */
  dispose(): void {
    this.stopSampling();
    this.clearScanTimer();
    this.connectionListeners.clear();
    this.adapterListeners.clear();
    this.sampleListeners.clear();
    this.batteryListeners.clear();
  }

  // ── 内部 ────────────────────────────────────────────────

  private dispatch(event: Parameters<typeof transition>[1]): void {
    const next = transition(this.context, event);
    if (next.state === this.context.state) {
      this.context = next;
      return;
    }
    this.context = next;
    for (const listener of this.connectionListeners) listener(next.state);
  }

  private startSampling(sampleRate = this.options.sampleRate ?? 200): void {
    this.stopSampling();

    const intervalMs = this.options.batchIntervalMs ?? 40;
    const samplesPerBatch = Math.max(1, Math.round((sampleRate * intervalMs) / 1000));

    this.sampleTimer = setInterval(() => {
      const samples = new Float32Array(samplesPerBatch);
      for (let index = 0; index < samplesPerBatch; index += 1) {
        samples[index] = this.nextSample(sampleRate);
      }
      const batch: SampleBatch = { samples, timestamp: Date.now(), sampleRate };
      for (const listener of this.sampleListeners) listener(batch);
    }, intervalMs);
  }

  private stopSampling(): void {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
  }

  private clearScanTimer(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  /**
   * 合成一个脉搏样本。
   *
   * 由三部分叠加：
   * 1. 主峰（收缩波）—— 心率 72bpm 的基频
   * 2. 重搏波（dicrotic notch）—— 二次谐波，真实脉搏的关键特征
   * 3. 呼吸基线漂移 + 噪声
   */
  private nextSample(sampleRate: number): number {
    const bpm = 72;
    const beatPeriod = (60 / bpm) * sampleRate;
    const t = (this.phase % beatPeriod) / beatPeriod;
    this.phase += 1;

    // 主峰：窄高斯脉冲
    const systolic = Math.exp(-(((t - 0.18) / 0.075) ** 2));
    // 重搏波：较低较宽的次峰
    const dicrotic = 0.38 * Math.exp(-(((t - 0.42) / 0.11) ** 2));
    // 呼吸基线漂移（约 0.25Hz）
    const baseline = 0.06 * Math.sin((2 * Math.PI * 0.25 * this.phase) / sampleRate);

    const noiseAmplitude = this.options.signalProfile === 'poor' ? 0.45 : 0.02;
    const noise = (Math.random() - 0.5) * 2 * noiseAmplitude;

    const value = systolic + dicrotic + baseline + noise;
    // 归一化到 [-1, 1]，与协议解码后的取值域一致
    return Math.max(-1, Math.min(1, value * 1.4 - 0.5));
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
