import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

/**
 * 本地存储（设计文档 §5.4）。
 *
 * 分工：
 * - MMKV：主题、引导完成标记、隐私同意、lastDeviceId、Query 持久化
 * - SecureStore：access / refresh token —— **凭证绝不进 MMKV**
 */
export const storage = createMMKV({ id: 'yuanxi' });

/** MMKV key 集中管理，避免散落的字符串字面量。 */
export const StorageKey = {
  /** 隐私协议同意（§8：同意前不得初始化任何三方 SDK） */
  privacyConsent: 'privacy.consent.v1',
  /** 健康数据处理的单独同意（§8：敏感个人信息需单独同意） */
  healthDataConsent: 'privacy.healthData.v1',
  onboardingDone: 'onboarding.done',
  lastDeviceId: 'device.lastId',
  queryCache: 'query.cache.v1',
  /** 未上传测量数据的索引 */
  pendingMeasurements: 'measurement.pending',
} as const;

export const localStore = {
  getBoolean: (key: string): boolean => storage.getBoolean(key) ?? false,
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  remove: (key: string): void => {
    storage.remove(key);
  },
  clearAll: (): void => storage.clearAll(),
};

/** JSON 读写；解析失败时返回 undefined 而不是抛错。 */
export function getJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 数据损坏时直接丢弃，避免反复解析失败
    storage.remove(key);
    return undefined;
  }
}

export function setJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

const ACCESS_TOKEN_KEY = 'yuanxi.accessToken';
const REFRESH_TOKEN_KEY = 'yuanxi.refreshToken';

/** 凭证存储 —— 只走 SecureStore（§5.4）。 */
export const tokenStore = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async save(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
