import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { radius, spacing } from '../tokens';

export interface ConstitutionItem {
  /** 体质名，如「气郁质」 */
  name: string;
  /** 倾向百分比 0–100 */
  percent: number;
  /** 是否为主体质 */
  primary?: boolean;
}

export interface ConstitutionBarsProps {
  items: readonly ConstitutionItem[];
  onPressItem?: (item: ConstitutionItem) => void;
}

/**
 * 体质倾向条形图（设计文档 §6.9 / §4.3.2）。
 *
 * 水平条，高 8pt 圆头；主体质用 primary-500，其余 ink-300；
 * 右侧百分比用等宽数字，避免数值变化时列宽抖动。
 */
export function ConstitutionBars({ items }: ConstitutionBarsProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => {
        const percent = Math.max(0, Math.min(item.percent, 100));
        return (
          <View
            accessibilityLabel={`${item.name} ${percent}%${item.primary ? '，主体质' : ''}`}
            key={item.name}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          >
            <Text style={{ width: 56 }} variant="body-sm">
              {item.name}
            </Text>

            <View
              style={{
                flex: 1,
                height: 8,
                borderRadius: radius.full,
                backgroundColor: isDark ? colors.border : colors.skeleton,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  borderRadius: radius.full,
                  backgroundColor: item.primary ? colors.accent : colors.borderStrong,
                }}
              />
            </View>

            <Text style={{ width: 44, textAlign: 'right' }} tone="secondary" variant="body-sm">
              {percent}%
            </Text>

            {/* 颜色之外再给一个文字标记，满足「不靠颜色单独表达」（§1.3 原则 2） */}
            <Text style={{ width: 20 }} tone={item.primary ? 'accent' : 'tertiary'} variant="caption">
              {item.primary ? '主' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
