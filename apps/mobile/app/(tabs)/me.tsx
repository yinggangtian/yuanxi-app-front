import { router } from 'expo-router';
import {
  Award,
  FileText,
  Headset,
  MapPin,
  Package,
  Receipt,
  Settings,
  Truck,
  Wallet,
} from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CONSTITUTION_LABEL } from '@/api/schemas';
import { BatteryIndicator, useBoundDevice, useFirmwareUpdate } from '@/features/device';
import { useOrderCounts } from '@/features/order';
import { useProfile } from '@/features/profile';
import {
  Badge,
  Card,
  Chip,
  Divider,
  Icon,
  ListItem,
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

/** 我的（设计文档 §4.6 / §7.14）。 */
export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: profile, isLoading } = useProfile();
  const { data: device } = useBoundDevice();
  const hasFirmwareUpdate = useFirmwareUpdate();
  const orderCounts = useOrderCounts();

  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;
  const genderLabel = { male: '男', female: '女', unknown: '未设置' }[profile?.gender ?? 'unknown'];

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT} contentStyle={{ paddingTop: insets.top + spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="设置" onPress={() => router.push('/settings')}>
          <Icon icon={Settings} size={22} tone="secondary" />
        </Pressable>
      </View>

      {/* 体质档案卡（§7.14） */}
      {isLoading || !profile ? (
        <Skeleton height={88} />
      ) : (
        <Pressable accessibilityLabel="编辑体质档案" onPress={() => router.push('/me/profile')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.full,
                backgroundColor: colors.accentSubtle,
              }}
            />
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <Text variant="title-2">{profile.nickname}</Text>
              <Text tone="secondary" variant="body-sm">
                {genderLabel}
                {age !== null ? ` · ${age} 岁` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {profile.primaryConstitution ? (
                  <Chip label={CONSTITUTION_LABEL[profile.primaryConstitution]} />
                ) : null}
                {profile.secondaryConstitutions.map((type) => (
                  <Chip key={type} label={`兼 ${CONSTITUTION_LABEL[type]}`} tone="neutral" />
                ))}
              </View>
            </View>
            <Text tone="tertiary" variant="body-sm">
              ›
            </Text>
          </View>
        </Pressable>
      )}

      <SectionGap size={spacing.lg} />

      {/* 等级与积分（§7.14） */}
      {profile ? (
        <Pressable accessibilityLabel="查看健康积分" onPress={() => router.push('/me/points')}>
          <Card style={{ backgroundColor: colors.accentSubtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1 }} variant="title-3">
                Lv.{profile.level} {profile.levelName}
              </Text>
              <Text tone="accent" variant="title-3">
                {profile.points} 积分
              </Text>
            </View>

            {/* 等级进度条 */}
            <View
              style={{
                height: 6,
                borderRadius: radius.full,
                backgroundColor: colors.surface,
                marginTop: spacing.sm,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: '85%',
                  height: '100%',
                  borderRadius: radius.full,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="caption">
              距 Lv.{profile.level + 1} 还差 220 积分
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <SectionGap />

      {/* 设备管理卡 */}
      <SectionHeader title="我的设备" />
      {device ? (
        <Pressable accessibilityLabel="设备管理" onPress={() => router.push('/device/manage')}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: radius.full,
                  backgroundColor: colors.success,
                }}
              />
              <Text style={{ flex: 1 }} variant="body">
                {device.name} 已连接
              </Text>
              <BatteryIndicator level={82} />
            </View>

            <Divider />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xxs,
                marginTop: spacing.sm,
              }}
            >
              <Text style={{ flex: 1 }} tone="secondary" variant="caption">
                固件 {device.firmware}
                {hasFirmwareUpdate ? `（有新版本 ${device.latestFirmware}）` : ''}
              </Text>
              {hasFirmwareUpdate ? <Badge /> : null}
            </View>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <Text variant="body-sm">还没有绑定设备</Text>
          <Pressable
            accessibilityLabel="去绑定设备"
            onPress={() => router.push('/device/scan')}
            style={{ marginTop: spacing.xs }}
          >
            <Text style={{ color: colors.accentText }} variant="body-sm">
              去绑定 →
            </Text>
          </Pressable>
        </Card>
      )}

      <SectionGap />

      {/* 商城服务（§7.14） */}
      <SectionHeader actionLabel="全部订单" onAction={() => router.push('/orders')} title="商城服务" />
      <Card padding={0}>
        <View style={{ flexDirection: 'row', paddingVertical: spacing.md }}>
          <OrderEntry
            count={orderCounts['pending-payment']}
            icon={Wallet}
            label="待付款"
            onPress={() => router.push('/orders')}
          />
          <OrderEntry
            count={orderCounts['pending-shipment']}
            icon={Package}
            label="待发货"
            onPress={() => router.push('/orders')}
          />
          <OrderEntry
            count={orderCounts['pending-receipt']}
            icon={Truck}
            label="待收货"
            onPress={() => router.push('/orders')}
          />
          <OrderEntry
            count={orderCounts['after-sales']}
            icon={Receipt}
            label="售后"
            onPress={() => router.push('/after-sales')}
          />
        </View>

        <Divider />

        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={MapPin}
            onPress={() => router.push('/address')}
            showChevron
            title="地址管理"
          />
          <Divider />
          <ListItem
            icon={FileText}
            onPress={() => router.push('/after-sales')}
            showChevron
            title="发票与售后"
          />
          <Divider />
          <ListItem icon={Headset} onPress={() => undefined} showChevron title="联系客服" />
          <Divider />
          <ListItem
            icon={Award}
            onPress={() => router.push('/me/badges')}
            showChevron
            title="我的勋章"
          />
        </View>
      </Card>
    </Screen>
  );
}

function OrderEntry({
  icon,
  label,
  count,
  onPress,
}: {
  icon: typeof Wallet;
  label: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}${count > 0 ? `，${count} 个订单` : ''}`}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', gap: spacing.xxs }}
    >
      <View>
        <Icon icon={icon} size={24} tone="secondary" />
        {count > 0 ? (
          <View style={{ position: 'absolute', top: -4, right: -8 }}>
            <Badge count={count} />
          </View>
        ) : null}
      </View>
      <Text tone="secondary" variant="caption">
        {label}
      </Text>
    </Pressable>
  );
}
