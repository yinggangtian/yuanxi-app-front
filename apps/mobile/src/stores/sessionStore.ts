import { create } from 'zustand';

import { setUnauthorizedHandler } from '../api/client';
import { tokenStore } from '../lib/storage';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

/**
 * 登录会话（设计文档 §5.4）。
 *
 * token 本身只存在 SecureStore，这里仅保留登录状态标记。
 * 游客可浏览商城首页与商品详情（§2.3 路由守卫）。
 */
interface SessionState {
  status: AuthStatus;
  userId: string | null;

  /** 应用启动时读取本地凭证 */
  restore: () => Promise<void>;
  signIn: (params: { userId: string; accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  userId: null,

  restore: async () => {
    const accessToken = await tokenStore.getAccessToken();
    set({ status: accessToken ? 'authenticated' : 'guest' });
  },

  signIn: async ({ userId, accessToken, refreshToken }) => {
    await tokenStore.save(accessToken, refreshToken);
    set({ status: 'authenticated', userId });
  },

  signOut: async () => {
    await tokenStore.clear();
    set({ status: 'guest', userId: null });
  },
}));

/**
 * 注册 401 回调：api 层不直接依赖 store，由此处反向注入，
 * 保持 §5.2 的依赖方向（api/ 不感知 stores/）。
 */
setUnauthorizedHandler(() => {
  useSessionStore.setState({ status: 'guest', userId: null });
});
