import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { useOrderDetail } from '@/features/order';
import { formatDateTime } from '@/lib/format';
import {
  Card,
  EmptyState,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/** 物流详情（设计文档 §4.5.7：物流时间轴）。 */
export default function LogisticsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId);
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <Screen>
        <Skeleton height={200} />
      </Screen>
    );
  }

  if (!order || order.logistics.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState description="商品发出后即可查看物流进度。" title="暂无物流信息" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text variant="title-3">{order.logisticsCompany ?? '物流公司'}</Text>
        <Text style={{ marginTop: 2 }} tone="secondary" variant="body-sm">
          运单号 {order.logisticsNo ?? '--'}
        </Text>
      </Card>

      <SectionGap size={spacing.md} />

      <Card>
        {order.logistics.map((node, index) => {
          const latest = index === 0;
          return (
            <View key={`${node.time}-${index}`} style={{ flexDirection: 'row', gap: spacing.sm }}>
              {/* 时间轴：节点 + 连线 */}
              <View style={{ alignItems: 'center', width: 16 }}>
                <View
                  style={{
                    width: latest ? 12 : 8,
                    height: latest ? 12 : 8,
                    borderRadius: radius.full,
                    backgroundColor: latest ? colors.accent : colors.border,
                    marginTop: 4,
                  }}
                />
                {index < order.logistics.length - 1 ? (
                  <View style={{ flex: 1, width: 1, backgroundColor: colors.border }} />
                ) : null}
              </View>

              <View style={{ flex: 1, paddingBottom: spacing.lg, gap: 2 }}>
                <Text tone={latest ? 'primary' : 'secondary'} variant="body-sm">
                  {node.description}
                </Text>
                <Text tone="tertiary" variant="caption">
                  {formatDateTime(node.time)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
