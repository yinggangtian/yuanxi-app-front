import { create } from 'zustand';


import type { BleAdapterState, DeviceInfo, DiscoveredDevice } from './api/types';
import type { ConnectionState } from './domain/ConnectionMachine';
import { StorageKey, localStore } from '../../lib/storage';

/**
 * 设备与连接状态（设计文档 §5.4）。
 *
 * ⚠️ 只存低频状态。**实时波形样本绝不进这里**——
 * 200Hz 数据进 store 会让整棵组件树每秒重渲染上百次（§5.4 规则）。
 */
interface DeviceState {
  adapterState: BleAdapterState;
  connectionState: ConnectionState;
  /** 已连接设备信息 */
  deviceInfo: DeviceInfo | null;
  /** 电量 0–100（1Hz 以下更新频率） */
  battery: number | null;
  /** 扫描发现的设备，按 RSSI 降序 */
  discovered: DiscoveredDevice[];
  /** 最近一次连接的设备 id，持久化到 MMKV 以支持自动回连 */
  lastDeviceId: string | null;

  setAdapterState: (state: BleAdapterState) => void;
  setConnectionState: (state: ConnectionState) => void;
  setDeviceInfo: (info: DeviceInfo | null) => void;
  setBattery: (level: number) => void;
  upsertDiscovered: (device: DiscoveredDevice) => void;
  clearDiscovered: () => void;
  rememberDevice: (deviceId: string) => void;
  forgetDevice: () => void;
}

/** 低电量阈值（§4.2.1 预检清单：电量 ≥20%）。 */
export const LOW_BATTERY_THRESHOLD = 20;

export const useDeviceStore = create<DeviceState>((set) => ({
  adapterState: 'unknown',
  connectionState: 'idle',
  deviceInfo: null,
  battery: null,
  discovered: [],
  lastDeviceId: localStore.getString(StorageKey.lastDeviceId) ?? null,

  setAdapterState: (adapterState) => set({ adapterState }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setDeviceInfo: (deviceInfo) => set({ deviceInfo, battery: deviceInfo?.battery ?? null }),
  setBattery: (battery) => set({ battery }),

  upsertDiscovered: (device) =>
    set((state) => {
      const existing = state.discovered.findIndex((item) => item.id === device.id);
      const next =
        existing >= 0
          ? state.discovered.map((item, index) => (index === existing ? device : item))
          : [...state.discovered, device];
      // 多台设备时按信号强度排序，最可能是「手边那台」的排最前（§4.4.1）
      return { discovered: [...next].sort((a, b) => b.rssi - a.rssi) };
    }),

  clearDiscovered: () => set({ discovered: [] }),

  rememberDevice: (deviceId) => {
    localStore.setString(StorageKey.lastDeviceId, deviceId);
    set({ lastDeviceId: deviceId });
  },

  forgetDevice: () => {
    // 解绑后必须清理本地设备缓存（§4.6）
    localStore.remove(StorageKey.lastDeviceId);
    set({ lastDeviceId: null, deviceInfo: null, battery: null, connectionState: 'idle' });
  },
}));
