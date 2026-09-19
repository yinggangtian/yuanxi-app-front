import { useCallback } from 'react';
import {
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface PressableProps extends Omit<RNPressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 按下时的不透明度，默认 0.7（§6.7 motion-fast 语义）。 */
  pressedOpacity?: number;
  className?: string;
}

/**
 * 统一按压反馈与最小可点击区域（§6.4：可点击区域 ≥ 44×44pt）。
 */
export function Pressable({
  style,
  pressedOpacity = 0.7,
  hitSlop,
  accessibilityRole = 'button',
  ...rest
}: PressableProps) {
  const resolveStyle = useCallback(
    ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
      style,
      pressed && !rest.disabled ? { opacity: pressedOpacity } : null,
    ],
    [style, pressedOpacity, rest.disabled],
  );

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop ?? { top: 8, bottom: 8, left: 8, right: 8 }}
      style={resolveStyle}
      {...rest}
    />
  );
}
