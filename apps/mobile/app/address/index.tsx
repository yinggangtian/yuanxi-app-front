import { router } from 'expo-router';
import { View } from 'react-native';

import { useAddresses } from '@/features/order';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Pressable,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  spacing,
} from '@/ui';

/** 地址管理（设计文档 §4.6）。 */
export default function AddressListScreen() {
  const { data: addresses, isLoading } = useAddresses();

  if (isLoading) {
    return (
      <Screen>
        <Skeleton height={100} />
      </Screen>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          actionLabel="新增地址"
          description="添加收货地址后即可下单。"
          onAction={() => router.push('/address/edit')}
          title="还没有收货地址"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {addresses.map((address) => (
        <Pressable
          accessibilityLabel={`编辑 ${address.receiver} 的地址`}
          key={address.id}
          onPress={() => router.push({ pathname: '/address/edit', params: { id: address.id } })}
        >
          <Card style={{ marginBottom: spacing.sm, gap: spacing.xxs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="title-3">{address.receiver}</Text>
              <Text tone="secondary" variant="body-sm">
                {address.phone}
              </Text>
              {address.isDefault ? <Chip label="默认" /> : null}
            </View>
            <Text tone="secondary" variant="body-sm">
              {address.province}
              {address.city}
              {address.district} {address.detail}
            </Text>
          </Card>
        </Pressable>
      ))}

      <SectionGap size={spacing.md} />

      <Button
        fullWidth
        label="新增收货地址"
        onPress={() => router.push('/address/edit')}
        size="lg"
        variant="secondary"
      />
    </Screen>
  );
}
