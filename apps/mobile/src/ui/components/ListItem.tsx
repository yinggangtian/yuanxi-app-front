import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Icon, Pressable, Text } from '../primitives';
import { LIST_ITEM_MIN_HEIGHT, spacing } from '../tokens';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** 左侧图标 */
  icon?: LucideIcon;
  iconTone?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  /** 右侧值文字 */
  value?: string;
  /** 右侧自定义内容，优先级高于 value */
  right?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 列表行（§6.10）：左图标 + 标题/副标题 + 右值/箭头，最小高度 56pt。 */
export function ListItem({
  title,
  subtitle,
  icon,
  iconTone = 'secondary',
  value,
  right,
  showChevron = false,
  onPress,
  disabled = false,
  style,
  testID,
}: ListItemProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        {
          minHeight: LIST_ITEM_MIN_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon icon={icon} size={20} tone={iconTone} /> : null}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body">{title}</Text>
        {subtitle ? (
          <Text tone="secondary" variant="caption">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? (value ? <Text tone="secondary" variant="body-sm">{value}</Text> : null)}
      {showChevron ? <ChevronRight color={colors.textTertiary} size={18} strokeWidth={1.5} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityLabel={title} disabled={disabled} onPress={onPress} testID={testID}>
      {content}
    </Pressable>
  );
}
