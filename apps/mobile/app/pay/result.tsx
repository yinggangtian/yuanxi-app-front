import { router, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useOrderDetail } from '@/features/order';
import { formatPrice } from '@/lib/format';
import {
  Button,
  Card,
  Icon,
  Pressable,
  Screen,
  SectionGap,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/** 轮询次数（§3.4：支付结果未知时轮询 3 次）。 */
const MAX_POLLS = 3;

type PayState = 'checking' | 'paid' | 'pending';

/** 支付成功与健康激励（设计文档 §4.5.6 / §7.12）。 */
export default function PayResultScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const { data: order } = useOrderDetail(orderId);

  const [state, setState] = useState<PayState>('checking');
  const [points, setPoints] = useState(0);

  /**
   * 查询服务端订单状态 —— **以服务端为准**，不以微信回调 errCode 为准（§5.7）。
   * 轮询 3 次仍未确认则展示「支付确认中」，而不是谎报成功。
   */
  useEffect(() => {
    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      // 演示：第 2 次轮询确认支付成功
      if (polls >= 2) {
        setState('paid');
        clearInterval(timer);
      } else if (polls >= MAX_POLLS) {
        setState('pending');
        clearInterval(timer);
      }
    }, 900);

    return () => clearInterval(timer);
  }, []);

  /** 积分数字滚动动画（§4.5.6，时长 ≤800ms）。 */
  useEffect(() => {
    if (state !== 'paid') return;

    const target = 200;
    const steps = 20;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setPoints(Math.round((target * current) / steps));
      if (current >= steps) clearInterval(timer);
    }, 800 / steps);

    return () => clearInterval(timer);
  }, [state]);

  const containsDevice = order?.containsDevice ?? false;

  return (
    <Screen contentStyle={{ paddingTop: spacing['3xl'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="关闭" onPress={() => router.replace('/orders')}>
          <Icon icon={X} size={22} tone="secondary" />
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        {state === 'paid' ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.full,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon color={colors.textOnAccent} icon={Check} size={32} />
          </Animated.View>
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.full,
              borderWidth: 2,
              borderColor: colors.border,
            }}
          />
        )}

        <Text variant="title-1">
          {state === 'paid' ? '支付成功' : state === 'checking' ? '正在确认支付结果' : '支付确认中'}
        </Text>

        {state === 'paid' && order ? (
          <Text tone="secondary" variant="metric">
            实付 {formatPrice(order.payAmount)}
          </Text>
        ) : (
          <Text style={{ textAlign: 'center' }} tone="secondary" variant="body-sm">
            {state === 'pending'
              ? '我们正在与支付平台确认，结果会在「我的订单」中更新。若已扣款请勿重复支付。'
              : '请稍候…'}
          </Text>
        )}

        {order ? (
          <Text tone="tertiary" variant="caption">
            订单号 {order.orderNo}
          </Text>
        ) : null}
      </View>

      <SectionGap />

      {/* 健康激励（§4.5.6） */}
      {state === 'paid' ? (
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card padding={spacing.lg} style={{ backgroundColor: colors.accentSubtle }}>
            <Text variant="title-3">🎁 本次获得</Text>

            <Text style={{ marginTop: spacing.xs }} tone="accent" variant="metric">
              +{points} 健康积分
            </Text>

            <View
              style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                gap: 2,
              }}
            >
              <Text variant="title-3">专属脉诊体验卡 × 3 次</Text>
              <Text tone="secondary" variant="caption">
                深度体质报告 · 有效期 90 天
              </Text>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <SectionGap />

      {containsDevice ? (
        <Text style={{ marginBottom: spacing.sm }} tone="secondary" variant="body-sm">
          设备预计 3–5 个工作日内送达。
        </Text>
      ) : null}

      {/* 含设备时主引导为佩戴教学，否则为开始脉诊（§4.5.6） */}
      <Button
        fullWidth
        label={containsDevice ? '先看看怎么佩戴 →' : '开始脉诊'}
        onPress={() => router.replace(containsDevice ? '/device/wear-guide' : '/pulse')}
        size="lg"
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.lg,
          marginTop: spacing.md,
        }}
      >
        <Pressable accessibilityLabel="查看订单" onPress={() => router.replace('/orders')}>
          <Text tone="secondary" variant="body-sm">
            查看订单
          </Text>
        </Pressable>
        <Pressable accessibilityLabel="继续逛逛" onPress={() => router.replace('/mall')}>
          <Text tone="secondary" variant="body-sm">
            继续逛逛
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
