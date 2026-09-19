import { router } from 'expo-router';
import { BookOpen, Crosshair, Download, Unlink } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useDeviceStore } from '@/features/bluetooth';
import { BatteryIndicator, useBoundDevice, useFirmwareUpdate } from '@/features/device';
import { maskSn } from '@/lib/format';
import {
  Badge,
  Card,
  Dialog,
  Divider,
  EmptyState,
  Icon,
  Pressable,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/** 设备管理（设计文档 §4.6 / §7.14 设备管理卡）。 */
export default function DeviceManageScreen() {
  const { colors } = useTheme();
  const { data: device, isLoading } = useBoundDevice();
  const hasUpdate = useFirmwareUpdate();
  const forgetDevice = useDeviceStore((state) => state.forgetDevice);
  const [unbindVisible, setUnbindVisible] = useState(false);

  if (isLoading) {
    return (
      <Screen>
        <Card>
          <Skeleton height={120} />
        </Card>
      </Screen>
    );
  }

  if (!device) {
    return (
      <Screen scroll={false}>
        <EmptyState
          actionLabel="去绑定"
          description="绑定脉搏环后即可管理设备。"
          onAction={() => router.replace('/device/scan')}
          title="还没有绑定设备"
        />
      </Screen>
    );
  }

  const actions = [
    {
      key: 'firmware',
      icon: Download,
      label: '固件升级',
      badge: hasUpdate,
      onPress: () => router.push('/device/firmware'),
    },
    { key: 'calibrate', icon: Crosshair, label: '重新校准', onPress: () => undefined },
    {
      key: 'wear',
      icon: BookOpen,
      label: '佩戴教学',
      onPress: () => router.push('/device/wear-guide'),
    },
    {
      key: 'unbind',
      icon: Unlink,
      label: '解绑',
      danger: true,
      onPress: () => setUnbindVisible(true),
    },
  ];

  return (
    <Screen>
      <Card padding={spacing.lg} variant="raised">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.full,
              borderWidth: 6,
              borderColor: colors.accentSubtle,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title-2">{device.name}</Text>
            <Text tone="secondary" variant="caption">
              SN {maskSn(device.sn)}
            </Text>
          </View>
          <BatteryIndicator level={82} />
        </View>

        <Divider />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.sm,
          }}
        >
          <Text tone="secondary" variant="body-sm">
            固件版本
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="body-sm">{device.firmware}</Text>
            {hasUpdate ? <Badge /> : null}
          </View>
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      {/* 4 宫格操作（§7.14） */}
      <Card padding={0}>
        <View style={{ flexDirection: 'row' }}>
          {actions.map((action, index) => (
            <View key={action.key} style={{ flex: 1, flexDirection: 'row' }}>
              {index > 0 ? (
                <View style={{ width: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
              ) : null}
              <Pressable
                accessibilityLabel={action.label}
                onPress={action.onPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  gap: spacing.xxs,
                }}
              >
                <View>
                  <Icon
                    icon={action.icon}
                    size={22}
                    tone={action.danger ? 'secondary' : 'accent'}
                  />
                  {action.badge ? (
                    <View style={{ position: 'absolute', top: -2, right: -6 }}>
                      <Badge />
                    </View>
                  ) : null}
                </View>
                <Text tone={action.danger ? 'secondary' : 'primary'} variant="caption">
                  {action.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      <Text tone="tertiary" variant="caption">
        解绑后，本机将清除该设备的连接记录。已生成的健康报告仍会保留在你的账号中。
      </Text>

      {/* 解绑二次确认（§4.6） */}
      <Dialog
        confirmLabel="解绑设备"
        destructive
        message={`解绑后需要重新搜索并绑定才能继续测量。确定要解绑「${device.name}」吗？`}
        onCancel={() => setUnbindVisible(false)}
        onConfirm={() => {
          forgetDevice();
          setUnbindVisible(false);
          router.replace('/');
        }}
        title="确定要解绑设备吗？"
        visible={unbindVisible}
      />
    </Screen>
  );
}
