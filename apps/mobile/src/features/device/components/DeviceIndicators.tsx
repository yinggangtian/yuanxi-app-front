import { Battery, BatteryLow, BatteryWarning } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon, Text, radius, spacing, useTheme } from '../../../ui';
import { LOW_BATTERY_THRESHOLD, rssiToBars, rssiToLabel } from '../../bluetooth';

/** 电量指示（§4.4.2）：图标 + 百分比，低电量额外变色并给出文字。 */
export function BatteryIndicator({ level }: { level: number }) {
  const low = level < LOW_BATTERY_THRESHOLD;
  const critical = level < 10;

  return (
    <View
      accessibilityLabel={`电量 ${level}%${low ? '，电量偏低' : ''}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Icon
        icon={critical ? BatteryWarning : low ? BatteryLow : Battery}
        size={18}
        tone={critical ? 'danger' : low ? 'warning' : 'secondary'}
      />
      <Text tone={critical ? 'danger' : low ? 'warning' : 'secondary'} variant="body-sm">
        {level}%
      </Text>
    </View>
  );
}

/**
 * 信号强度 4 格（§4.4.2）。
 * 格数 + 文字双重表达，不依赖颜色（§1.3 原则 2）。
 */
export function SignalBars({ rssi }: { rssi: number }) {
  const { colors } = useTheme();
  const bars = rssiToBars(rssi);
  const label = rssiToLabel(rssi);

  return (
    <View
      accessibilityLabel={`信号强度 ${label}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {[1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={{
              width: 3,
              height: 4 + index * 3,
              borderRadius: radius.xs,
              backgroundColor: index <= bars ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
      <Text tone="secondary" variant="body-sm">
        {label}
      </Text>
    </View>
  );
}

/** 设备状态胶囊（§7.2）。 */
export function DeviceStatusPill({
  connected,
  name,
  battery,
}: {
  connected: boolean;
  name: string;
  battery: number | null;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: radius.full,
          backgroundColor: connected ? colors.success : colors.textTertiary,
        }}
      />
      <Text variant="body-sm">
        {name} {connected ? '已连接' : '未连接'}
      </Text>
      {battery !== null ? <BatteryIndicator level={battery} /> : null}
    </View>
  );
}
