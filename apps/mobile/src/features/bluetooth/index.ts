/**
 * bluetooth feature 公共出口（设计文档 §5.2）。
 * 其它 feature 只能从这里导入，不得深入内部文件。
 */
export type { BleService } from './api/BleService';
export { MockBleService, type MockBleOptions } from './api/MockBleService';
export {
  ADAPTER_STATE_MESSAGE,
  rssiToBars,
  rssiToLabel,
  type BleAdapterState,
  type DeviceInfo,
  type DiscoveredDevice,
  type FirmwareFile,
  type MeasurementConfig,
  type SampleBatch,
  type Unsubscribe,
} from './api/types';
export {
  canStartMeasurement,
  isConnected,
  MAX_RECONNECT_ATTEMPTS,
  MEASURING_RECONNECT_WINDOW_MS,
  reconnectDelayMs,
  type ConnectionState,
} from './domain/ConnectionMachine';
export { encodePacket, PacketAssembler, type Packet } from './domain/Packet';
export { crc16, verifyCrc16 } from './domain/crc';
export { LOW_BATTERY_THRESHOLD, useDeviceStore } from './store';
