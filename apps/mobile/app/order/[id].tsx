import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ORDER_STATUS_LABEL } from '@/api/schemas';
import { useOrderDetail } from '@/features/order';
import { formatDateTime, formatPrice } from '@/lib/format';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  radius,
  spacing,
} from '@/ui';

/** 订单详情（设计文档 §4.5.7）。 */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton height={200} />
      </Screen>
    );
  }

  if (isError || !order) {
    return (
      <Screen scroll={false}>
        <ErrorState description="订单可能已被删除。" onAction={() => void refetch()} title="订单不存在" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text variant="title-2">{ORDER_STATUS_LABEL[order.status]}</Text>
        {order.status === 'pending-receipt' ? (
          <Button
            fullWidth
            label="查看物流"
            onPress={() =>
              router.push({ pathname: '/order/logistics', params: { orderId: order.id } })
            }
            size="md"
            style={{ marginTop: spacing.sm }}
            variant="secondary"
          />
        ) : null}
      </Card>

      <SectionGap size={spacing.md} />

      {order.address ? (
        <Card>
          <Text variant="title-3">收货信息</Text>
          <Text style={{ marginTop: spacing.xxs }} variant="body-sm">
            {order.address.receiver} {order.address.phone}
          </Text>
          <Text tone="secondary" variant="body-sm">
            {order.address.province}
            {order.address.city}
            {order.address.district} {order.address.detail}
          </Text>
        </Card>
      ) : null}

      <SectionGap size={spacing.md} />

      <Card>
        {order.items.map((item, index) => (
          <View key={item.id}>
            {index > 0 ? <Divider /> : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm }}>
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
              <View style={{ alignItems: 'flex-end' }}>
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

        <Divider />

        <View style={{ marginTop: spacing.sm, gap: spacing.xxs }}>
          <SummaryRow label="商品小计" value={formatPrice(order.goodsAmount)} />
          <SummaryRow
            label="运费"
            value={order.freightAmount === 0 ? '免运费' : formatPrice(order.freightAmount)}
          />
          {order.discountAmount > 0 ? (
            <SummaryRow label="优惠" value={`-${formatPrice(order.discountAmount)}`} />
          ) : null}
          {order.pointsDeduction > 0 ? (
            <SummaryRow label="积分抵扣" value={`-${formatPrice(order.pointsDeduction)}`} />
          ) : null}
          <SummaryRow bold label="实付款" value={formatPrice(order.payAmount)} />
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      <Card>
        <SummaryRow label="订单编号" value={order.orderNo} />
        <SummaryRow label="下单时间" value={formatDateTime(order.createdAt)} />
        {order.paidAt ? <SummaryRow label="支付时间" value={formatDateTime(order.paidAt)} /> : null}
      </Card>
    </Screen>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs }}
    >
      <Text tone="secondary" variant="body-sm">
        {label}
      </Text>
      <Text tone={bold ? 'price' : 'primary'} variant={bold ? 'title-3' : 'body-sm'}>
        {value}
      </Text>
    </View>
  );
}
