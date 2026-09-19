import { create } from 'zustand';

import { StorageKey, localStore } from '../lib/storage';

/**
 * 应用级客户端状态（设计文档 §5.4）。
 *
 * ⚠️ 合规（§8）：`privacyConsent` 为 false 时，
 * **不得初始化任何三方 SDK（Sentry / 微信 / 统计）**，也不得采集任何信息。
 */
interface AppState {
  /** 隐私协议是否已同意 */
  privacyConsent: boolean;
  /** 健康数据处理的单独同意（敏感个人信息，需与总协议分开） */
  healthDataConsent: boolean;
  /** 新手引导是否完成 */
  onboardingDone: boolean;

  acceptPrivacy: () => void;
  acceptHealthData: () => void;
  completeOnboarding: () => void;
  /** 注销账号 / 撤回同意时清空 */
  revokeConsent: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  privacyConsent: localStore.getBoolean(StorageKey.privacyConsent),
  healthDataConsent: localStore.getBoolean(StorageKey.healthDataConsent),
  onboardingDone: localStore.getBoolean(StorageKey.onboardingDone),

  acceptPrivacy: () => {
    localStore.setBoolean(StorageKey.privacyConsent, true);
    set({ privacyConsent: true });
  },

  acceptHealthData: () => {
    localStore.setBoolean(StorageKey.healthDataConsent, true);
    set({ healthDataConsent: true });
  },

  completeOnboarding: () => {
    localStore.setBoolean(StorageKey.onboardingDone, true);
    set({ onboardingDone: true });
  },

  revokeConsent: () => {
    localStore.remove(StorageKey.privacyConsent);
    localStore.remove(StorageKey.healthDataConsent);
    set({ privacyConsent: false, healthDataConsent: false });
  },
}));
