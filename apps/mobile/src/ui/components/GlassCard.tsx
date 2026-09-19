import { BlurView } from 'expo-blur';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceTransparency } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { CARD_PADDING, radius } from '../tokens';

import { GLASS_BLUR_INTENSITY, GLASS_SPEC, shouldDegradeGlassHere } from './glass';

export interface GlassCardProps {
  children: React.ReactNode;
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * 磨砂玻璃卡片（设计文档 §6.6）。
 *
 * 使用规则（调用方需自行遵守，组件不做运行时强制）：
 * 1. 只在**有内容/色彩的背景之上**使用 —— 纯色背景上用玻璃毫无意义。
 * 2. 同一视区最多 2 层玻璃，**禁止玻璃叠玻璃**。
 * 3. 玻璃上的文字只用 `primary` / `secondary` tone，不用更浅的灰度。
 */
export function GlassCard({
  children,
  padding = CARD_PADDING,
  borderRadius = radius.lg,
  style,
  testID,
}: GlassCardProps) {
  const { scheme } = useTheme();
  const reduceTransparency = useReduceTransparency();
  const spec = GLASS_SPEC[scheme];
  const degraded = shouldDegradeGlassHere(reduceTransparency);

  const frame: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    borderColor: spec.borderColor,
    overflow: 'hidden',
  };

  if (degraded) {
    return (
      <View
        style={[frame, { backgroundColor: spec.opaqueBackground, padding }, style]}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[frame, style]} testID={testID}>
      <BlurView
        intensity={GLASS_BLUR_INTENSITY}
        style={{ padding, backgroundColor: spec.translucentBackground }}
        tint={spec.blurTint}
      >
        {children}
      </BlurView>
    </View>
  );
}
