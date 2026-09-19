import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCheckoutPreview } from '@/features/order';
import { formatPrice } from '@/lib/format';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  ErrorState,
  Icon,
  Input,
  PAGE_PADDING,
  Pressable,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/** 确认订单（设计文档 §4.5.4）。 */
export default function CheckoutScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: preview, isLoading, isError, refetch } = useCheckoutPreview();

  const [usePoints, setUsePoints] = useState(false);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton height={80} />
        <SectionGap />
        <Skeleton height={160} />
      </Screen>
    );
  }

  if (isError || !preview) {
    return (
      <Screen scroll={false}>
        <ErrorState
          description="预订单计算失败，请返回购物车重试。"
          onAction={() => void refetch()}
          title="无法生成订单"
        />
      </Screen>
    );
  }

  const pointsDeduction = usePoints ? preview.maxPointsDeduction : 0;
  // 展示用；提交后以服务端返回的订单金额为准（§4.5.3）
  const payAmount = Math.max(0, preview.payAmount - pointsDeduction);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={72}>
        {/* 收货地址 */}
        <Pressable accessibilityLabel="选择收货地址" onPress={() => router.push('/address')}>
          <Card style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon icon={MapPin} size={20} tone="accent" />
            {preview.address ? (
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <Text variant="title-3">{preview.address.receiver}</Text>
                  <Text tone="secondary" variant="body-sm">
                    {preview.address.phone}
                  </Text>
                </View>
                <Text tone="secondary" variant="body-sm">
                  {preview.address.province}
                  {preview.address.city}
                  {preview.address.district} {preview.address.detail}
                </Text>
              </View>
            ) : (
              <Text style={{ flex: 1 }} tone="secondary" variant="body-sm">
                请选择收货地址
              </Text>
            )}
            <Text tone="tertiary" variant="body-sm">
              ›
            </Text>
          </Card>
        </Pressable>

        <SectionGap size={spacing.md} />

        {/* 商品清单 */}
        <Card>
          {preview.items.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Divider /> : null}
              <View
                style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: radius.sm,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={2} variant="body-sm">
                    {item.title}
                  </Text>
                  <Text tone="tertiary" variant="caption">
                    {item.skuName}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text tone="price" variant="body-sm">
                    {formatPrice(item.price)}
                  </Text>
                  <Text tone="tertiary" variant="caption">
                    ×{item.quantity}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <SectionGap size={spacing.md} />

        {/* 优惠与积分 */}
        <Card>
          <AmountRow label="商品小计" value={formatPrice(preview.goodsAmount)} />
          <AmountRow
            label="运费"
            value={preview.freightAmount === 0 ? '免运费' : formatPrice(preview.freightAmount)}
          />
          {preview.discountAmount > 0 ? (
            <AmountRow label="优惠" value={`-${formatPrice(preview.discountAmount)}`} />
          ) : null}

          <Divider />

          <Pressable
            accessibilityLabel="使用积分抵扣"
            onPress={() => setUsePoints((value) => !value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: spacing.sm,
            }}
          >
            <Checkbox
              accessibilityLabel="使用积分抵扣"
              checked={usePoints}
              onChange={setUsePoints}
            />
            <Text style={{ flex: 1 }} variant="body-sm">
              使用积分抵扣
            </Text>
            <Text tone={usePoints ? 'price' : 'tertiary'} variant="body-sm">
              {usePoints ? `-${formatPrice(pointsDeduction)}` : `最多抵 ${formatPrice(preview.maxPointsDeduction)}`}
            </Text>
          </Pressable>
        </Card>

        <SectionGap size={spacing.md} />

        <Card>
          <Input
            label="订单备注"
            maxLength={50}
            onChangeText={setRemark}
            placeholder="选填，如收货时间要求"
            value={remark}
          />
        </Card>

        <SectionGap size={spacing.md} />

        <Text tone="tertiary" variant="caption">
          提交订单即表示同意《购买协议》。实际应付金额以服务端计算结果为准。
        </Text>
      </Screen>

      {/* 底部提交栏 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: PAGE_PADDING,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text tone="secondary" variant="caption">
              应付
            </Text>
            <Text tone="price" variant="metric">
              {formatPrice(payAmount)}
            </Text>
          </View>
        </View>

        <Button
          disabled={!preview.address}
          label="提交订单"
          loading={submitting}
          onPress={() => {
            setSubmitting(true);
            // 演示：创建订单后进入支付确认（§5.7）
            setTimeout(() => {
              setSubmitting(false);
              router.replace({ pathname: '/pay/[orderId]', params: { orderId: 'o_1001' } });
            }, 500);
          }}
          size="lg"
          testID="checkout-submit"
        />
      </View>
    </View>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
      }}
    >
      <Text tone="secondary" variant="body-sm">
        {label}
      </Text>
      <Text variant="body-sm">{value}</Text>
    </View>
  );
}
