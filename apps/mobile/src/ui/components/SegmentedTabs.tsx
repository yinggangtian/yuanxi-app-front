import { useCallback, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { Pressable, Text } from '../primitives';
import { duration, easingStandard, spacing } from '../tokens';

import { Badge } from './Badge';

export interface SegmentedTabItem {
  key: string;
  label: string;
  /** 角标数量，如「待付款•1」 */
  badge?: number;
}

export interface SegmentedTabsProps {
  items: SegmentedTabItem[];
  value: string;
  onChange: (key: string) => void;
  /** 项数较多时（如订单状态）允许横向滚动 */
  scrollable?: boolean;
  testID?: string;
}

interface TabLayout {
  x: number;
  width: number;
}

/** 指示器宽度取标签宽度的 60%，居中对齐 —— 视觉更克制。 */
const INDICATOR_WIDTH_RATIO = 0.6;

/**
 * 分段标签（§6.10）：下划线指示器用 Reanimated 滑动。
 * 用于订单状态、趋势周期、调理建议分类。
 *
 * 指示器位置由 `layouts[value]` 声明式推导，不持有 SharedValue，
 * 避免在事件回调里对动画值做命令式赋值。
 */
export function SegmentedTabs({
  items,
  value,
  onChange,
  scrollable = false,
  testID,
}: SegmentedTabsProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [layouts, setLayouts] = useState<Record<string, TabLayout>>({});

  const handleLayout = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      setLayouts((prev) => {
        const previous = prev[key];
        if (previous && previous.x === x && previous.width === width) return prev;
        return { ...prev, [key]: { x, width } };
      });
    },
    [],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const layout = layouts[value];
    if (!layout) return { width: 0, transform: [{ translateX: 0 }] };

    const width = layout.width * INDICATOR_WIDTH_RATIO;
    const x = layout.x + (layout.width - width) / 2;
    const config = { duration: reducedMotion ? 0 : duration.base, easing: easingStandard };

    return {
      width: withTiming(width, config),
      transform: [{ translateX: withTiming(x, config) }],
    };
  }, [layouts, value, reducedMotion]);

  const row = (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={item.key}
            onLayout={handleLayout(item.key)}
            onPress={() => onChange(item.key)}
            style={{
              paddingVertical: spacing.xs,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text tone={active ? 'primary' : 'secondary'} variant={active ? 'title-3' : 'body'}>
              {item.label}
            </Text>
            {item.badge ? <Badge count={item.badge} /> : null}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View testID={testID}>
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {row}
        </ScrollView>
      ) : (
        row
      )}
      <Animated.View
        style={[
          { height: 2, borderRadius: 1, backgroundColor: colors.accent, marginTop: 2 },
          indicatorStyle,
        ]}
      />
    </View>
  );
}
