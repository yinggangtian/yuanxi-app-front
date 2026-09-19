import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '../hooks/useTheme';

export interface IconProps {
  icon: LucideIcon;
  /** 图标尺寸，默认 24pt 网格（§6.8）。 */
  size?: number;
  color?: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'danger';
}

/**
 * 线性图标（§6.8）：1.5pt 描边、24pt 网格、圆角端点。
 * 基础图标库用 Lucide（MIT）；业务图标由设计定制但须遵循同一描边规范。
 */
export function Icon({ icon: LucideComponent, size = 24, color, tone = 'primary' }: IconProps) {
  const { colors } = useTheme();

  const toneColor = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[tone];

  return (
    <LucideComponent
      color={color ?? toneColor}
      size={size}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
