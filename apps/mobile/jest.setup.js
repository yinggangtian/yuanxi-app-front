/* eslint-disable no-undef */
// RNTL v14 起内置 jest matchers，无需再引入 extend-expect。

// MMKV 在 Node 环境下没有原生实现，用内存 Map 替身。
jest.mock('react-native-mmkv', () => {
  class MMKV {
    constructor() {
      this.store = new Map();
    }
    set(k, v) {
      this.store.set(k, v);
    }
    getString(k) {
      const v = this.store.get(k);
      return typeof v === 'string' ? v : undefined;
    }
    getBoolean(k) {
      const v = this.store.get(k);
      return typeof v === 'boolean' ? v : undefined;
    }
    getNumber(k) {
      const v = this.store.get(k);
      return typeof v === 'number' ? v : undefined;
    }
    contains(k) {
      return this.store.has(k);
    }
    delete(k) {
      this.store.delete(k);
    }
    clearAll() {
      this.store.clear();
    }
    getAllKeys() {
      return [...this.store.keys()];
    }
  }
  return { MMKV };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
