import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrivacyConsentGate } from '@/features/consent';
import { createQueryClient } from '@/lib/queryClient';
import { useAppStore, useSessionStore } from '@/stores';
import { ToastProvider, useTheme } from '@/ui';

import '../global.css';


/**
 * 根布局（设计文档 §2.3）。
 *
 * Providers 顺序：GestureHandler → SafeArea → Query → Toast。
 *
 * ⚠️ 合规（§8）：隐私协议同意前不初始化任何三方 SDK、不发起任何网络请求，
 * 因此 PrivacyConsentGate 包在最外层，未同意时只渲染协议页。
 */
export default function RootLayout() {
  // 惰性初始化：QueryClient 只在首次渲染时创建一次
  const [queryClient] = useState(createQueryClient);
  const restore = useSessionStore((state) => state.restore);
  const privacyConsent = useAppStore((state) => state.privacyConsent);

  useEffect(() => {
    // 同意隐私协议后才读取本地凭证
    if (privacyConsent) void restore();
  }, [privacyConsent, restore]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemedStatusBar />
            <PrivacyConsentGate>
              <RootNavigator />
            </PrivacyConsentGate>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)/profile" options={{ title: '完善档案' }} />

      <Stack.Screen name="device/scan" options={{ headerShown: false }} />
      <Stack.Screen name="device/confirm" options={{ title: '' }} />
      <Stack.Screen name="device/wear-guide" options={{ title: '' }} />
      <Stack.Screen name="device/manual" options={{ title: '手动添加' }} />
      <Stack.Screen name="device/manage" options={{ title: '设备管理' }} />
      <Stack.Screen name="device/firmware" options={{ title: '固件升级' }} />

      {/* 测量中为全屏模态：隐藏 TabBar 与返回手势，退出需二次确认（§2.1） */}
      <Stack.Screen
        name="measure/live"
        options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
      />

      <Stack.Screen name="report/[id]" options={{ title: '健康报告' }} />
      <Stack.Screen name="report/trend" options={{ title: '趋势' }} />

      <Stack.Screen name="product/[id]" options={{ title: '' }} />
      <Stack.Screen name="cart" options={{ title: '购物车' }} />
      <Stack.Screen name="checkout" options={{ title: '确认订单' }} />
      {/* 支付确认为 formSheet（§2.3） */}
      <Stack.Screen
        name="pay/[orderId]"
        options={{ presentation: 'formSheet', headerShown: false, sheetAllowedDetents: [0.72] }}
      />
      <Stack.Screen name="pay/result" options={{ headerShown: false, gestureEnabled: false }} />

      <Stack.Screen name="orders" options={{ title: '我的订单' }} />
      <Stack.Screen name="order/[id]" options={{ title: '订单详情' }} />
      <Stack.Screen name="order/logistics" options={{ title: '物流详情' }} />

      <Stack.Screen name="address/index" options={{ title: '地址管理' }} />
      <Stack.Screen name="address/edit" options={{ title: '编辑地址' }} />
      <Stack.Screen name="after-sales" options={{ title: '发票与售后' }} />

      <Stack.Screen name="me/profile" options={{ title: '体质档案' }} />
      <Stack.Screen name="me/points" options={{ title: '健康积分' }} />
      <Stack.Screen name="me/badges" options={{ title: '勋章' }} />
      <Stack.Screen name="settings" options={{ title: '设置' }} />

      <Stack.Screen name="+not-found" options={{ title: '页面不存在' }} />
    </Stack>
  );
}
