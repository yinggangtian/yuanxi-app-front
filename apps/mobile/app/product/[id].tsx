import { router, useLocalSearchParams } from 'expo-router';
import { Headset, ShoppingCart } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Sku } from '@/api/schemas';
import { useCartBadge, useCartStore } from '@/features/cart';
import { useProductDetail } from '@/features/mall';
import { formatPrice } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  Icon,
  PAGE_PADDING,
  Pressable,
  Screen,
  SectionGap,
  Sheet,
  Skeleton,
  Stepper,
  Text,
  radius,
  spacing,
  useOptionalToast,
  useTheme,
} from '@/ui';

/** 商品详情（设计文档 §4.5.2）。 */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useOptionalToast();

  const { data: product, isLoading, isError, refetch } = useProductDetail(id);
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartBadge();

  const [skuSheetVisible, setSkuSheetVisible] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  /** 点「立即购买」时，选完规格直接进结算 */
  const [buyNow, setBuyNow] = useState(false);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton borderRadius={radius.lg} height={280} />
        <SectionGap />
        <Skeleton height={24} width="70%" />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen scroll={false}>
        <ErrorState
          description="商品可能已下架，请返回商城查看其它商品。"
          onAction={() => void refetch()}
          title="商品不存在"
        />
      </Screen>
    );
  }

  const selectedSku = product.skus.find((sku) => sku.id === selectedSkuId) ?? product.skus[0];
  const maxQuantity = selectedSku
    ? selectedSku.purchaseLimit === null
      ? selectedSku.stock
      : Math.min(selectedSku.stock, selectedSku.purchaseLimit)
    : 1;

  const confirmSku = () => {
    if (!selectedSku) return;
    addItem({
      id: `ci_${selectedSku.id}_${Date.now()}`,
      productId: product.id,
      skuId: selectedSku.id,
      title: product.title,
      skuName: selectedSku.name,
      imageUrl: product.imageUrl,
      price: selectedSku.price,
      quantity,
      stock: selectedSku.stock,
      purchaseLimit: selectedSku.purchaseLimit,
      selected: true,
      invalid: false,
      invalidReason: null,
    });
    setSkuSheetVisible(false);

    if (buyNow) router.push('/checkout');
    else toast.show('已加入购物车', 'success');
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={64}>
        {/* 主图 */}
        <View
          style={{
            height: 280,
            borderRadius: radius.lg,
            backgroundColor: colors.accentSubtle,
          }}
        />

        <SectionGap size={spacing.md} />

        <Text tone="price" variant="metric">
          {formatPrice(product.price)}
        </Text>
        {product.originalPrice ? (
          <Text
            style={{ textDecorationLine: 'line-through', marginTop: 2 }}
            tone="tertiary"
            variant="body-sm"
          >
            {formatPrice(product.originalPrice)}
          </Text>
        ) : null}

        <Text style={{ marginTop: spacing.xs }} variant="title-2">
          {product.title}
        </Text>

        {product.tags.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
            {product.tags.map((tag) => (
              <Chip key={tag.label} label={tag.label} />
            ))}
          </View>
        ) : null}

        <SectionGap size={spacing.md} />

        {/* 规格选择入口 */}
        <Pressable accessibilityLabel="选择规格" onPress={() => setSkuSheetVisible(true)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: 48 }} tone="secondary" variant="body-sm">
              规格
            </Text>
            <Text style={{ flex: 1 }} variant="body-sm">
              {selectedSku?.name ?? '请选择'}
            </Text>
            <Text tone="tertiary" variant="body-sm">
              ›
            </Text>
          </Card>
        </Pressable>

        <SectionGap size={spacing.md} />

        <Card>
          <Text variant="title-3">商品详情</Text>
          <Text style={{ marginTop: spacing.xs }} tone="secondary" variant="body-sm">
            {product.description}
          </Text>

          {/* 资质展示（§8：「医疗级」标签必须同时展示注册证号） */}
          {product.certificateNumber ? (
            <>
              <Divider />
              <View style={{ marginTop: spacing.sm }}>
                <Text variant="title-3">资质信息</Text>
                <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
                  医疗器械注册证号：{product.certificateNumber}
                </Text>
              </View>
            </>
          ) : null}
        </Card>

        <SectionGap size={spacing.md} />

        <Text tone="tertiary" variant="caption">
          本商品为健康类产品，相关描述不构成医疗建议，不能替代医生诊断与治疗。
        </Text>
      </Screen>

      {/* 底部栏（§4.5.2） */}
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
        <Pressable accessibilityLabel="联系客服" onPress={() => router.push('/after-sales')}>
          <Icon icon={Headset} size={22} tone="secondary" />
        </Pressable>

        <Pressable accessibilityLabel={`购物车，${cartCount} 件`} onPress={() => router.push('/cart')}>
          <View>
            <Icon icon={ShoppingCart} size={22} tone="secondary" />
            <View style={{ position: 'absolute', top: -4, right: -8 }}>
              <Badge count={cartCount} />
            </View>
          </View>
        </Pressable>

        <Button
          label="加入购物车"
          onPress={() => {
            setBuyNow(false);
            setSkuSheetVisible(true);
          }}
          size="lg"
          style={{ flex: 1 }}
          variant="secondary"
        />
        <Button
          label="立即购买"
          onPress={() => {
            setBuyNow(true);
            setSkuSheetVisible(true);
          }}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>

      {/* SKU 选择弹层 */}
      <Sheet onClose={() => setSkuSheetVisible(false)} title="选择规格" visible={skuSheetVisible}>
        <View style={{ gap: spacing.sm }}>
          {product.skus.map((sku) => (
            <SkuOption
              key={sku.id}
              onSelect={() => {
                setSelectedSkuId(sku.id);
                setQuantity(1);
              }}
              selected={sku.id === selectedSku?.id}
              sku={sku}
            />
          ))}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: spacing.xs,
            }}
          >
            <Text variant="body-sm">购买数量</Text>
            <Stepper max={maxQuantity} onChange={setQuantity} value={quantity} />
          </View>

          {selectedSku?.purchaseLimit !== null && selectedSku?.purchaseLimit !== undefined ? (
            <Text tone="tertiary" variant="caption">
              每人限购 {selectedSku.purchaseLimit} 件
            </Text>
          ) : null}

          <Button
            disabled={!selectedSku || selectedSku.stock === 0}
            fullWidth
            label={buyNow ? '立即购买' : '加入购物车'}
            onPress={confirmSku}
            size="lg"
            style={{ marginTop: spacing.xs }}
          />
        </View>
      </Sheet>
    </View>
  );
}

function SkuOption({
  sku,
  selected,
  onSelect,
}: {
  sku: Sku;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const soldOut = sku.stock === 0;

  return (
    <Pressable
      accessibilityLabel={`${sku.name}${soldOut ? '，已售罄' : ''}`}
      accessibilityState={{ selected, disabled: soldOut }}
      disabled={soldOut}
      onPress={onSelect}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSubtle : 'transparent',
          opacity: soldOut ? 0.45 : 1,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body-sm">{sku.name}</Text>
          <Text tone="tertiary" variant="caption">
            {soldOut ? '已售罄' : `库存 ${sku.stock} 件`}
          </Text>
        </View>
        <Text tone="price" variant="body-sm">
          {formatPrice(sku.price)}
        </Text>
      </View>
    </Pressable>
  );
}
