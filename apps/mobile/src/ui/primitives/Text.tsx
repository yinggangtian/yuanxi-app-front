import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { typography, typographyStyle, type TypographyToken } from '../tokens';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'onAccent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'price';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  /** 字号 token（§6.3）。数值类 token 自动使用 Inter + 等宽数字。 */
  variant?: TypographyToken;
  tone?: TextTone;
  /** 少量场景下的微调；颜色与字号请优先用 variant / tone。 */
  style?: RNTextProps['style'];
  className?: string;
}

/**
 * 设计系统文本（设计文档 §6.10）。
 *
 * 业务代码不应直接使用 react-native 的 Text —— 否则字号阶梯、等宽数字、
 * 动态字体上限都会失控。
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const toneColor: Record<TextTone, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accentText,
    onAccent: colors.textOnAccent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    price: colors.price,
  };

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? typography[variant].maxFontSizeMultiplier}
      style={[typographyStyle(variant), { color: toneColor[tone] }, style]}
      {...rest}
    />
  );
}
