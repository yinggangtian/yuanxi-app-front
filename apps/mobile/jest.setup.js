/* eslint-disable no-undef */
// RNTL v14 起内置 jest matchers，无需再引入 extend-expect。

// MMKV 在 Node 环境下没有原生实现，用内存 Map 替身。
// MMKV v4 走 Nitro 原生模块，Node 环境下用内存 Map 替身。
jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const store = new Map();
    return {
      id: 'test',
      get length() {
        return store.size;
      },
      set: (k, v) => store.set(k, v),
      getString: (k) => (typeof store.get(k) === 'string' ? store.get(k) : undefined),
      getBoolean: (k) => (typeof store.get(k) === 'boolean' ? store.get(k) : undefined),
      getNumber: (k) => (typeof store.get(k) === 'number' ? store.get(k) : undefined),
      contains: (k) => store.has(k),
      remove: (k) => store.delete(k),
      clearAll: () => store.clear(),
      getAllKeys: () => [...store.keys()],
      addOnValueChangedListener: () => ({ remove: () => {} }),
    };
  };
  return { createMMKV, existsMMKV: () => false, deleteMMKV: () => {} };
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
