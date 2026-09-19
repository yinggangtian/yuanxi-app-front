import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';

import { Badge } from './Badge';
import { GlassCard } from './GlassCard';

export interface TabBarItemProps {
  label: string;
  icon: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  badge?: number;
  /** 小红点（设备异常挂在「我的」上，§2.1） */
  dot?: boolean;
}

/** TabBar 高度（§7.1：56pt + 底部安全区）。 */
export const TAB_BAR_HEIGHT = 56;
/** 中央脉诊按钮直径与上浮量（§7.1）。 */
export const CENTER_BUTTON_SIZE = 56;
export const CENTER_BUTTON_LIFT = 16;

/** TabBar 容器：玻璃背景 + 1px 顶线（§7.1）。 */
export function TabBarContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <GlassCard
      borderRadius={0}
      padding={0}
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          // 只保留顶线，左右下不描边
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        },
        style,
      ]}
    >
      <View
        style={{
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    </GlassCard>
  );
}

/** 普通 Tab 项：24pt 图标 + micro 10pt 文字（§7.1）。 */
export function TabBarItem({ label, icon, focused, badge, dot }: Omit<TabBarItemProps, 'onPress'>) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View>
        {icon}
        {badge ? (
          <View style={{ position: 'absolute', top: -4, right: -10 }}>
            <Badge count={badge} />
          </View>
        ) : dot ? (
          <View style={{ position: 'absolute', top: -2, right: -4 }}>
            <Badge />
          </View>
        ) : null}
      </View>
      <Text tone={focused ? 'accent' : 'tertiary'} variant="micro">
        {label}
      </Text>
    </View>
  );
}
