import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ORDER_STATUS_LABEL, type OrderStatus, type OrderSummary } from '@/api/schemas';
import { useOrders } from '@/features/order';
import { formatDateTime, formatPrice, formatRemaining } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  Pressable,
  Screen,
  SectionGap,
  SegmentedTabs,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

type Filter = OrderStatus | 'all';

/** 状态 Tab（§4.5.7）：补入「待收货」，否则已发货订单无处归类。 */
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending-payment', label: '待付款' },
  { key: 'pending-shipment', label: '待发货' },
  { key: 'pending-receipt', label: '待收货' },
  { key: 'completed', label: '已完成' },
];

/** 我的订单（设计文档 §4.5.7 / §7.13）。 */
export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: orders, isLoading } = useOrders(filter);

  return (
    <Screen>
      <SegmentedTabs
        items={FILTERS.map((entry) => ({ key: entry.key, label: entry.label }))}
        onChange={(key) => setFilter(key as Filter)}
        scrollable
        value={filter}
      />

      <SectionGap size={spacing.md} />

      {isLoading ? (
        <Card>
          <Skeleton height={120} />
        </Card>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          actionLabel="去逛逛"
          description="这里会显示你的订单记录。"
          onAction={() => router.push('/mall')}
          title="暂无相关订单"
        />
      ) : (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      )}
    </Screen>
  );
}

/** 订单卡片（§7.13）：状态、商品缩略、金额、快捷操作。 */
function OrderCard({ order }: { order: OrderSummary }) {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState<string | null>(null);

  /** 待付款倒计时（§4.5.7）。 */
  useEffect(() => {
    if (order.status !== 'pending-payment' || !order.payExpireAt) return;

    const tick = () => setCountdown(formatRemaining(order.payExpireAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order.status, order.payExpireAt]);

  const statusTone =
    order.status === 'pending-payment'
      ? colors.warning
      : order.status === 'completed'
        ? colors.textSecondary
        : colors.accent;

  return (
    <Pressable
      accessibilityLabel={`订单 ${order.orderNo}，${ORDER_STATUS_LABEL[order.status]}`}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <Card style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1 }} tone="secondary" variant="caption">
            {formatDateTime(order.createdAt)}
          </Text>
          <Text style={{ color: statusTone }} variant="body-sm">
            {ORDER_STATUS_LABEL[order.status]}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.sm,
          }}
        >
          {order.items.slice(0, 3).map((item) => (
            <View
              key={item.id}
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.sm,
                backgroundColor: 'rgba(0,0,0,0.04)',
              }}
            />
          ))}

          <View style={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
            <Text tone="secondary" variant="caption">
              共 {order.totalQuantity} 件
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text tone="secondary" variant="caption">
                实付
              </Text>
              <Text tone="price" variant="title-3">
                {formatPrice(order.payAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* 快捷操作（§4.5.7） */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.sm,
          }}
        >
          {countdown ? (
            <Text style={{ flex: 1 }} tone="warning" variant="caption">
              剩余 {countdown}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {order.status === 'pending-payment' ? (
            <>
              <Button label="取消订单" onPress={() => undefined} size="sm" variant="secondary" />
              <Button
                label="去付款"
                onPress={() =>
                  router.push({ pathname: '/pay/[orderId]', params: { orderId: order.id } })
                }
                size="sm"
              />
            </>
          ) : order.status === 'pending-receipt' ? (
            <>
              <Button
                label="查看物流"
                onPress={() =>
                  router.push({ pathname: '/order/logistics', params: { orderId: order.id } })
                }
                size="sm"
                variant="secondary"
              />
              <Button label="确认收货" onPress={() => undefined} size="sm" />
            </>
          ) : order.status === 'completed' ? (
            <>
              <Button
                label="申请售后"
                onPress={() => router.push('/after-sales')}
                size="sm"
                variant="secondary"
              />
              <Button label="再次购买" onPress={() => router.push('/mall')} size="sm" />
            </>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
