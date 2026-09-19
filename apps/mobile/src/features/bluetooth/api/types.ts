/** BLE 对外类型（设计文档 §5.5.1）。 */

export type BleAdapterState =
  | 'unknown'
  | 'poweredOff'
  | 'unauthorized'
  | 'unsupported'
  | 'poweredOn';

export type Unsubscribe = () => void;

export interface DiscoveredDevice {
  /** iOS: UUID；Android: MAC */
  id: string;
  name: string;
  rssi: number;
  /** 从广播 manufacturerData 解析 */
  sn?: string;
  model?: 'ring-pro' | 'ring';
}

export interface DeviceInfo {
  sn: string;
  model: string;
  firmware: string;
  /** 0–100 */
  battery: number;
}

export interface MeasurementConfig {
  /** 期望采样率（Hz），最终以硬件协商结果为准 */
  sampleRate: number;
  /** 计划测量时长（秒） */
  durationSec: number;
}

/**
 * 样本批次（§5.6）。
 *
 * 原生侧每 40ms 合并约 8 个样本为一批回调，
 * 避免 200Hz 逐样本跨桥带来的开销。
 */
export interface SampleBatch {
  /** 归一化到 [-1, 1] 的脉搏信号 */
  samples: Float32Array;
  /** 该批首样本的设备时间戳（ms） */
  timestamp: number;
  /** 采样率，用于时间轴换算 */
  sampleRate: number;
}

export interface FirmwareFile {
  version: string;
  uri: string;
  sizeBytes: number;
}

/** RSSI → 4 格信号强度（§4.4.2 设备确认卡片）。 */
export function rssiToBars(rssi: number): 1 | 2 | 3 | 4 {
  if (rssi >= -55) return 4;
  if (rssi >= -67) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

/** 信号强度文字 —— 颜色之外必须有文字（§1.3 原则 2）。 */
export function rssiToLabel(rssi: number): string {
  const bars = rssiToBars(rssi);
  return { 1: '弱', 2: '一般', 3: '良好', 4: '很强' }[bars];
}

/** 蓝牙适配器状态对应的用户可读文案与修复指引（§3.4 异常链路）。 */
export const ADAPTER_STATE_MESSAGE: Record<BleAdapterState, string> = {
  unknown: '正在检查蓝牙状态…',
  poweredOff: '请开启手机蓝牙后继续',
  unauthorized: '元息需要蓝牙权限才能连接脉搏环',
  unsupported: '当前设备不支持低功耗蓝牙，无法连接脉搏环',
  poweredOn: '蓝牙已就绪',
};
