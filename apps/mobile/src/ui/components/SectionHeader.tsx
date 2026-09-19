import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Pressable, Text } from '../primitives';
import { spacing } from '../tokens';

export interface SectionHeaderProps {
  title: string;
  /** 右侧「全部 >」入口 */
  actionLabel?: string;
  onAction?: () => void;
}

/** 模块标题行（§7.2 的「近 7 次趋势 … 全部 >」）。 */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      }}
    >
      <Text variant="title-3">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Text tone="secondary" variant="body-sm">
            {actionLabel}
          </Text>
          <ChevronRight color={colors.textTertiary} size={16} strokeWidth={1.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
