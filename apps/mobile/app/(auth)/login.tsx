import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionStore } from '@/stores';
import {
  Button,
  Checkbox,
  Input,
  PAGE_PADDING,
  Pressable,
  Text,
  spacing,
  useOptionalToast,
  useTheme,
} from '@/ui';

/** 验证码倒计时秒数。 */
const CODE_COOLDOWN_SEC = 60;

/**
 * 登录（设计文档 §4.7 / §8）。
 *
 * ⚠️ App Store 审核 4.8（§8）：提供微信等第三方登录时，
 * iOS 端**必须**同时提供 Sign in with Apple 或同等选项。
 */
export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useOptionalToast();
  const signIn = useSessionStore((state) => state.signIn);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const phoneValid = /^1[3-9]\d{9}$/.test(phone);
  const canSubmit = phoneValid && code.length === 6 && agreed;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = (method: string) => {
    if (!agreed) {
      toast.show('请先阅读并同意用户协议与隐私政策', 'warning');
      return;
    }
    setSubmitting(true);
    // 演示：直接建立会话；真实实现调用登录接口并保存 token
    setTimeout(() => {
      void signIn({
        userId: 'u_1001',
        accessToken: `demo-access-${method}`,
        refreshToken: 'demo-refresh',
      });
      setSubmitting(false);
      router.replace('/');
    }, 600);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + spacing['3xl'],
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: PAGE_PADDING,
      }}
    >
      <Text variant="title-1">欢迎回来</Text>
      <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
        登录后即可查看你的健康报告与订单
      </Text>

      <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
        <Input
          keyboardType="phone-pad"
          label="手机号"
          maxLength={11}
          numeric
          onChangeText={setPhone}
          placeholder="请输入手机号"
          value={phone}
        />

        <Input
          keyboardType="number-pad"
          label="验证码"
          maxLength={6}
          numeric
          onChangeText={setCode}
          placeholder="6 位验证码"
          right={
            <Pressable
              accessibilityLabel="获取验证码"
              disabled={!phoneValid || cooldown > 0}
              onPress={() => {
                setCooldown(CODE_COOLDOWN_SEC);
                toast.show('验证码已发送');
              }}
            >
              <Text
                style={{
                  color: phoneValid && cooldown === 0 ? colors.accentText : colors.textTertiary,
                }}
                variant="body-sm"
              >
                {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
              </Text>
            </Pressable>
          }
          value={code}
        />
      </View>

      <Button
        disabled={!canSubmit}
        fullWidth
        label="登录"
        loading={submitting}
        onPress={() => handleLogin('phone')}
        size="lg"
        style={{ marginTop: spacing.lg }}
        testID="login-submit"
      />

      <View style={{ flex: 1 }} />

      <View style={{ gap: spacing.sm }}>
        <Button
          fullWidth
          label="微信登录"
          onPress={() => handleLogin('wechat')}
          size="lg"
          variant="secondary"
        />

        {/* iOS 必须提供 Apple 登录（§8 App Store 4.8） */}
        {Platform.OS === 'ios' ? (
          <Button
            fullWidth
            label="通过 Apple 登录"
            onPress={() => handleLogin('apple')}
            size="lg"
            variant="secondary"
          />
        ) : null}
      </View>

      {/* 协议勾选默认不勾（合规要求不得默认同意） */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.xs,
          marginTop: spacing.md,
        }}
      >
        <View style={{ paddingTop: 2 }}>
          <Checkbox
            accessibilityLabel="同意用户协议与隐私政策"
            checked={agreed}
            onChange={setAgreed}
          />
        </View>
        <Text style={{ flex: 1 }} tone="secondary" variant="caption">
          我已阅读并同意《用户协议》与《隐私政策》
        </Text>
      </View>
    </View>
  );
}
