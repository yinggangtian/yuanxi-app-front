import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { duration, easingStandard, radius } from '../tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** 骨架屏（§6.10）：ink-100 底 + 微光扫过；「减弱动态效果」时保持静态。 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.xs,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const shimmer = useSharedValue(0.6);

  useEffect(() => {
    if (reducedMotion) {
      shimmer.value = 0.75;
      return;
    }
    shimmer.value = withRepeat(
      withTiming(1, { duration: duration.breath / 3, easing: easingStandard }),
      -1,
      true,
    );
  }, [reducedMotion, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View
      accessibilityLabel="加载中"
      style={[{ width, height, borderRadius, backgroundColor: colors.skeleton }, animatedStyle, style]}
    />
  );
}

/** 多行文本骨架。 */
export function SkeletonLines({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}
