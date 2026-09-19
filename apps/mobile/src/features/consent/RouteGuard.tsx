import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useSessionStore } from '../../stores/sessionStore';

/**
 * 路由守卫（设计文档 §2.3）。
 *
 * | 条件 | 行为 |
 * |---|---|
 * | 未同意隐私协议 | 仅展示协议页（由 PrivacyConsentGate 处理，不在本组件） |
 * | 未登录 | 重定向 (auth)/login；**商城首页与商品详情允许游客浏览** |
 * | 已登录 & 无绑定设备 & 首次 | 引导 device/scan（可「稍后再说」跳过） |
 * | 已登录 & 档案未完善 | 首次测量前拦截到 (onboarding)/profile |
 *
 * 设备绑定与档案完善的拦截发生在**进入对应页面时**（脉诊准备页已内建
 * 无设备空态），因此此处只处理登录态这一条全局重定向。
 */

/** 游客可访问的路由前缀（§2.3）。 */
const GUEST_ALLOWED_SEGMENTS = new Set(['(auth)', 'mall', 'product', '+not-found']);

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const segments = useSegments();

  useEffect(() => {
    // 凭证尚未读取完成时不做任何跳转，避免闪烁
    if (status === 'loading') return;

    // typedRoutes 下 useSegments() 返回的是字面量元组联合，
    // 这里只需按位置读取，放宽为 string[] 访问
    const parts = segments as readonly string[];
    const first = parts[0];
    const second = parts[1];
    // (tabs)/mall 需要看第二段才能判断是否为商城
    const routeKey = first === '(tabs)' ? (second ?? 'index') : (first ?? '');

    const isGuestAllowed = GUEST_ALLOWED_SEGMENTS.has(routeKey) || routeKey === 'index';
    const inAuthGroup = first === '(auth)';

    if (status === 'guest' && !isGuestAllowed && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // 已登录却停留在登录页 → 回到首页
    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/');
    }
  }, [status, segments]);

  return <>{children}</>;
}
