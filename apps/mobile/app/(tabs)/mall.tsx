import { router } from 'expo-router';
import {
  BadgeCheck,
  Cable,
  CupSoda,
  Flame,
  Pill,
  Search,
  ShoppingCart,
  Watch,
  type LucideIcon,
} from 'lucide-react-native';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProductSummary } from '@/api/schemas';
import { useCartBadge } from '@/features/cart';
import { useMallHome } from '@/features/mall';
import { formatPriceCompact } from '@/lib/format';
import {
  Badge,
  Card,
  Chip,
  Icon,
  PAGE_PADDING,
  Pressable,
  Screen,
  SectionGap,
  SectionHeader,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

import { TAB_BAR_HEIGHT } from './_layout';

/** 金刚区图标映射（icon 名由接口下发，映射集中在前端）。 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  watch: Watch,
  cable: Cable,
  'cup-soda': CupSoda,
  pill: Pill,
  flame: Flame,
  'badge-check': BadgeCheck,
};

/** 商城首页（设计文档 §4.5.1 / §7.9）。游客可浏览，无需登录（§2.3）。 */
export default function MallScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, isLoading } = useMallHome();
  const cartCount = useCartBadge();

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT} contentStyle={{ paddingTop: insets.top + spacing.md }}>
      {/* 顶部：标题 + 搜索 + 购物车 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ flex: 1 }} variant="title-1">
          商城
        </Text>
        <Pressable accessibilityLabel="搜索商品" onPress={() => undefined}>
          <Icon icon={Search} size={22} tone="secondary" />
        </Pressable>
        <Pressable accessibilityLabel={`购物车，${cartCount} 件`} onPress={() => router.push('/cart')}>
          <View>
            <Icon icon={ShoppingCart} size={22} tone="secondary" />
            <View style={{ position: 'absolute', top: -4, right: -8 }}>
              <Badge count={cartCount} />
            </View>
          </View>
        </Pressable>
      </View>

      <SectionGap size={spacing.md} />

      {isLoading || !data ? (
        <Skeleton borderRadius={radius.xl} height={180} />
      ) : (
        <>
          {/* 新品横幅（§7.9） */}
          {data.banners[0] ? (
            <Pressable
              accessibilityLabel={`${data.banners[0].title}，${data.banners[0].subtitle}`}
              onPress={() => {
                const productId = data.banners[0]?.productId;
                if (productId) router.push(`/product/${productId}`);
              }}
            >
              <View
                style={{
                  height: 180,
                  borderRadius: radius.xl,
                  backgroundColor: colors.accentSubtle,
                  padding: spacing.lg,
                  justifyContent: 'center',
                  gap: spacing.xxs,
                }}
              >
                {data.banners[0].badge ? (
                  <Chip label={data.banners[0].badge} tone="accent" />
                ) : null}
                <Text variant="title-1">{data.banners[0].title}</Text>
                <Text tone="secondary" variant="body-sm">
                  {data.banners[0].subtitle}
                </Text>
              </View>
            </Pressable>
          ) : null}

          <SectionGap size={spacing.lg} />

          {/* 品类金刚区 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
            {data.categories.map((category) => (
              <Pressable
                accessibilityLabel={category.name}
                key={category.id}
                onPress={() => undefined}
                style={{ width: '25%', alignItems: 'center', gap: spacing.xxs }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.accentSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon icon={CATEGORY_ICONS[category.icon] ?? Pill} size={24} tone="accent" />
                </View>
                <Text tone="secondary" variant="caption">
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionGap />

          {/* 推荐流 */}
          <SectionHeader title="为你推荐" />
          <ProductGrid products={data.products} />
        </>
      )}
    </Screen>
  );
}

/** 双列商品流（§7.9）。 */
function ProductGrid({ products }: { products: ProductSummary[] }) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - PAGE_PADDING * 2 - spacing.sm) / 2;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {products.map((product) => (
        <Pressable
          accessibilityLabel={product.title}
          key={product.id}
          onPress={() => router.push(`/product/${product.id}`)}
          style={{ width: columnWidth }}
        >
          <Card padding={spacing.sm} style={{ gap: spacing.xxs }}>
            <View
              style={{
                height: columnWidth - spacing.sm * 2,
                borderRadius: radius.sm,
                backgroundColor: 'rgba(0,0,0,0.04)',
              }}
            />
            <Text numberOfLines={2} variant="body-sm">
              {product.title}
            </Text>

            {product.tags[0] ? <Chip label={product.tags[0].label} /> : null}

            {product.recommendedReason ? (
              <Text tone="accent" variant="caption">
                {product.recommendedReason}
              </Text>
            ) : null}

            {/* 价格用 price 专色 + 等宽数字（§6.2.3） */}
            <Text tone="price" variant="title-3">
              {formatPriceCompact(product.price)}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}
