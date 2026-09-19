import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CartItem } from '@/api/schemas';
import {
  calculateTotals,
  isAllSelected,
  maxQuantityFor,
  partitionItems,
  useCartStore,
} from '@/features/cart';
import { formatPrice } from '@/lib/format';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Icon,
  PAGE_PADDING,
  Pressable,
  Screen,
  SectionGap,
  Stepper,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/** 购物车（设计文档 §4.5.3 / §7.10）。 */
export default function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const toggleSelected = useCartStore((state) => state.toggleSelected);
  const toggleAll = useCartStore((state) => state.toggleAll);
  const remove = useCartStore((state) => state.remove);
  const clearInvalid = useCartStore((state) => state.clearInvalid);

  const [editing, setEditing] = useState(false);

  const { valid, invalid } = partitionItems(items);
  const totals = calculateTotals(items);
  const allSelected = isAllSelected(items);

  if (items.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          actionLabel="去逛逛"
          description="挑选适合你体质的健康好物。"
          onAction={() => router.replace('/mall')}
          title="购物车还是空的"
        />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={72}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel={editing ? '完成编辑' : '管理购物车'}
            onPress={() => setEditing((value) => !value)}
          >
            <Text tone="secondary" variant="body-sm">
              {editing ? '完成' : '管理'}
            </Text>
          </Pressable>
        </View>

        <SectionGap size={spacing.xs} />

        {/* 有效商品 */}
        {valid.map((item) => (
          <CartRow
            editing={editing}
            item={item}
            key={item.id}
            onQuantityChange={(quantity) => setQuantity(item.id, quantity)}
            onRemove={() => remove(item.id)}
            onToggle={() => toggleSelected(item.id)}
          />
        ))}

        {/* 失效商品区（§4.5.3） */}
        {invalid.length > 0 ? (
          <>
            <SectionGap size={spacing.md} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.xs,
              }}
            >
              <Text style={{ flex: 1 }} tone="secondary" variant="body-sm">
                失效商品 {invalid.length} 件
              </Text>
              <Pressable accessibilityLabel="清空失效商品" onPress={clearInvalid}>
                <Text style={{ color: colors.accentText }} variant="caption">
                  清空
                </Text>
              </Pressable>
            </View>

            {invalid.map((item) => (
              <CartRow
                editing={editing}
                item={item}
                key={item.id}
                onQuantityChange={() => undefined}
                onRemove={() => remove(item.id)}
                onToggle={() => undefined}
              />
            ))}
          </>
        ) : null}
      </Screen>

      {/* 底部结算栏（§7.10） */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: PAGE_PADDING,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Pressable
            accessibilityLabel="全选"
            onPress={toggleAll}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          >
            <Checkbox accessibilityLabel="全选" checked={allSelected} onChange={toggleAll} />
            <Text variant="body-sm">全选</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text tone="secondary" variant="caption">
                合计
              </Text>
              <Text tone="price" variant="metric">
                {formatPrice(totals.goodsAmount)}
              </Text>
            </View>
            {/* 前端汇总仅作展示，最终金额以服务端预订单为准（§4.5.3） */}
            <Text tone="tertiary" variant="caption">
              运费与优惠将在结算时计算
            </Text>
          </View>

          <Button
            disabled={!totals.canCheckout}
            label={`结算(${totals.selectedQuantity})`}
            onPress={() => router.push('/checkout')}
            size="lg"
            testID="cart-checkout"
          />
        </View>
      </View>
    </View>
  );
}

function CartRow({
  item,
  editing,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  editing: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Card style={{ marginBottom: spacing.sm, opacity: item.invalid ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ justifyContent: 'center' }}>
          <Checkbox
            accessibilityLabel={`选择 ${item.title}`}
            checked={item.selected && !item.invalid}
            disabled={item.invalid}
            onChange={onToggle}
          />
        </View>

        <View
          style={{
            width: 64,
            height: 64,
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

          {item.invalid ? (
            <Text tone="warning" variant="caption">
              {item.invalidReason ?? '该商品已失效'}
            </Text>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: spacing.xxs,
              }}
            >
              <Text tone="price" variant="body-sm">
                {formatPrice(item.price)}
              </Text>
              <Stepper
                max={maxQuantityFor(item)}
                onChange={onQuantityChange}
                value={item.quantity}
              />
            </View>
          )}
        </View>

        {editing || item.invalid ? (
          <Pressable
            accessibilityLabel={`删除 ${item.title}`}
            onPress={onRemove}
            style={{ justifyContent: 'center' }}
          >
            <Icon color={colors.textTertiary} icon={Trash2} size={18} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
