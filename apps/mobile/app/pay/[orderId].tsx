import { router, useLocalSearchParams } from 'expo-router';
import { Lock, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOrderDetail } from '@/features/order';
import { formatCountdown, formatPrice } from '@/lib/format';
import {
  Button,
  Divider,
  Icon,
  PAGE_PADDING,
  Pressable,
  Skeleton,
  Text,
  radius,
  spacing,
  useOptionalToast,
  useTheme,
} from '@/ui';

/**
 * 支付确认（设计文档 §4.5.5 / §7.11）。
 *
 * ⚠️⚠️ 合规红线（§4.5.5 / §8）：
 * 本页是**元息自己的订单确认卡片**，视觉克制、使用元息品牌色。
 * 点击「确认支付」后必须拉起**真正的微信支付**完成付款。
 *
 * **严禁**在 App 内仿制微信支付的密码键盘 / 收银台界面 ——
 * 这会被微信商户平台与应用商店认定为仿冒，存在封号与下架风险。
 * 因此本页不出现微信绿、不出现密码输入、不模拟任何微信原生界面。
 */
export default function PayScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useOptionalToast();

  const { data: order, isLoading } = useOrderDetail(orderId);
  const [paying, setPaying] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  /** 支付剩余时间倒计时（§4.5.5）。 */
  useEffect(() => {
    if (!order?.payExpireAt) return;

    const tick = () => {
      const remaining = Math.floor((new Date(order.payExpireAt!).getTime() - Date.now()) / 1000);
      setRemainingSec(Math.max(0, remaining));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.payExpireAt]);

  const expired = remainingSec === 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        paddingHorizontal: PAGE_PADDING,
        paddingTop: spacing.sm,
        paddingBottom: insets.bottom + spacing.lg,
      }}
    >
      {/* 拖拽把手 */}
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: radius.full,
          backgroundColor: colors.border,
          marginBottom: spacing.sm,
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1 }} variant="title-2">
          确认支付
        </Text>
        <Pressable accessibilityLabel="关闭" onPress={() => router.back()}>
          <Icon icon={X} size={22} tone="secondary" />
        </Pressable>
      </View>

      {isLoading || !order ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Skeleton height={48} />
          <Skeleton height={80} />
        </View>
      ) : (
        <>
          {/* 金额：用 ink-900 而非价格红，更贴近「确认支付」的可信语气（§7.11） */}
          <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: spacing.xxs }}>
            <Text variant="metric-lg">{formatPrice(order.payAmount)}</Text>
            {remainingSec !== null ? (
              <Text tone={expired ? 'danger' : 'warning'} variant="caption">
                {expired ? '支付已超时，订单可能已关闭' : `支付剩余时间 ${formatCountdown(remainingSec)}`}
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <InfoRow
              label="订单"
              value={`${order.items[0]?.title.slice(0, 10) ?? '商品'}… 等 ${order.totalQuantity} 件`}
            />
            {/* 商户主体披露（§4.5.5 商户 / 安全背书） */}
            <InfoRow label="商户" value="元息健康科技（杭州）有限公司" />
          </View>

          <Divider />

          {/* 支付方式单选 —— 用元息自己的样式，不模仿微信界面 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.sm,
              marginTop: spacing.sm,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.accent,
              backgroundColor: colors.accentSubtle,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: radius.full,
                borderWidth: 5,
                borderColor: colors.accent,
              }}
            />
            <Text style={{ flex: 1 }} variant="body">
              微信支付
            </Text>
            <Text tone="accent" variant="caption">
              推荐
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: spacing.md,
            }}
          >
            <Icon icon={Lock} size={14} tone="tertiary" />
            <Text tone="tertiary" variant="caption">
              支付由微信支付提供安全保障
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <Button
            disabled={expired}
            fullWidth
            label={`确认支付 ${formatPrice(order.payAmount)}`}
            loading={paying}
            onPress={() => {
              setPaying(true);
              // 真实实现：yuanxi-wechat 模块 isInstalled() → pay(params) 拉起微信 App，
              // 回调 errCode 仅作 UI 提示，**支付结果以服务端订单状态为准**（§5.7）。
              setTimeout(() => {
                setPaying(false);
                toast.show('支付完成，正在确认订单状态…');
                router.replace({ pathname: '/pay/result', params: { orderId: order.id } });
              }, 900);
            }}
            size="lg"
            testID="pay-confirm"
          />
        </>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text tone="secondary" variant="body-sm">
        {label}
      </Text>
      <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right' }} variant="body-sm">
        {value}
      </Text>
    </View>
  );
}
