/** 间距、圆角、投影 token（设计文档 §6.4 / §6.5）。 */
import { Platform, type ViewStyle } from 'react-native';

/** 4pt 基准栅格（§6.4）。 */
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** 页面左右边距（§6.4）。 */
export const PAGE_PADDING = 20;
/** 卡片内边距：常规 16，主卡 20。 */
export const CARD_PADDING = 16;
export const HERO_CARD_PADDING = 20;
/** 列表行最小高度 / 最小可点击区域（§6.4）。 */
export const LIST_ITEM_MIN_HEIGHT = 56;
export const MIN_HIT_SIZE = 44;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/**
 * 投影（§6.5）：冷色、低不透明度，**只用于浮起元素**。
 * 默认卡片无投影，仅靠白卡 / ink-50 背景的明度差区分层级。
 */
type ShadowToken = 'sm' | 'md' | 'lg' | 'glowPrimary';

const SHADOW_SPECS: Record<
  ShadowToken,
  { color: string; offsetY: number; radius: number; opacity: number; elevation: number }
> = {
  sm: { color: '#0E1A22', offsetY: 1, radius: 3, opacity: 0.06, elevation: 1 },
  md: { color: '#0E1A22', offsetY: 6, radius: 20, opacity: 0.08, elevation: 4 },
  lg: { color: '#0E1A22', offsetY: 12, radius: 32, opacity: 0.12, elevation: 8 },
  // 脉诊主按钮、设备光晕 —— Android 无对应 elevation 表达，降级为无投影
  glowPrimary: { color: '#12998E', offsetY: 8, radius: 24, opacity: 0.28, elevation: 0 },
};

export function shadow(token: ShadowToken): ViewStyle {
  const spec = SHADOW_SPECS[token];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: spec.color,
      shadowOffset: { width: 0, height: spec.offsetY },
      shadowRadius: spec.radius,
      shadowOpacity: spec.opacity,
    },
    default: { elevation: spec.elevation },
  });
}
