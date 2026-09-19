import type {
  BleAdapterState,
  DeviceInfo,
  DiscoveredDevice,
  FirmwareFile,
  MeasurementConfig,
  SampleBatch,
  Unsubscribe,
} from './types';

import type { ConnectionState } from '../domain/ConnectionMachine';

/**
 * BLE 服务接口（设计文档 §5.5.1）。
 *
 * 业务层只依赖此接口；底层实现可在以下之间切换而不影响任何调用方：
 * - `MockBleService`  —— 模拟器开发、UI 调试、Maestro E2E
 * - `PlxBleService`   —— V1，基于 react-native-ble-plx
 * - `NativeBleService`—— 后续自研 Expo Module（性能与国产 ROM 兼容性更可控）
 */
export interface BleService {
  getAdapterState(): Promise<BleAdapterState>;
  onAdapterStateChange(callback: (state: BleAdapterState) => void): Unsubscribe;
  /** Android 12+ 需 BLUETOOTH_SCAN/CONNECT；≤11 需定位权限（§5.5.4） */
  requestPermissions(): Promise<boolean>;

  scan(
    options: { timeoutMs: number },
    onFound: (device: DiscoveredDevice) => void,
  ): Unsubscribe;

  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  onConnectionChange(callback: (state: ConnectionState) => void): Unsubscribe;

  /** 业务级命令；协议细节封装在 domain/Protocol 内 */
  startMeasurement(config: MeasurementConfig): Promise<void>;
  stopMeasurement(): Promise<void>;
  /** 批量回调，见 §5.6 */
  onSamples(callback: (batch: SampleBatch) => void): Unsubscribe;
  onBattery(callback: (level: number) => void): Unsubscribe;

  startOta(firmware: FirmwareFile, onProgress: (percent: number) => void): Promise<void>;
}
