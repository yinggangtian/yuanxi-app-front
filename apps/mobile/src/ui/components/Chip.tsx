import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Pressable, Text } from '../primitives';
import { radius, spacing } from '../tokens';

export type ChipTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  /** 选中态（用于筛选类 Chip） */
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * 标签（§6.10）。
 * 体质标签用 accent（primary-50 底 + primary-600 字）；
 * 状态标签用语义色 10% 底 —— 保证色盲用户也能靠文字读出状态。
 */
export function Chip({ label, tone = 'accent', selected, onPress, style, testID }: ChipProps) {
  const { colors } = useTheme();

  const toneColor: Record<ChipTone, string> = {
    accent: colors.accent,
    neutral: colors.textSecondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  };

  const color = toneColor[tone];
  const body = (
    <View
      style={[
        {
          paddingHorizontal: spacing.xs,
          paddingVertical: 4,
          borderRadius: radius.xs,
          backgroundColor: selected ? color : `${color}1A`, // 10% 透明度底
          alignSelf: 'flex-start',
        },
        style,
      ]}
      testID={testID}
    >
      <Text style={{ color: selected ? colors.textOnAccent : color }} variant="caption">
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress}>
      {body}
    </Pressable>
  );
}
