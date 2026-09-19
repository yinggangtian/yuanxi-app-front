/**
 * Yuanxi Design System —— 色彩 token（设计文档 §6.2）。
 *
 * 使用约定：业务代码只引用 `semantic` 中的语义 token，
 * 不直接引用 `palette` 色阶，深浅色模式才能自动适配。
 */

/** 原始色阶。仅设计系统内部与图表使用。 */
export const palette = {
  /** 品牌色「息青」 */
  primary: {
    50: '#EEF9F8',
    100: '#D3F0ED',
    200: '#A6E0DA',
    300: '#6FCBC2',
    400: '#36B3A8',
    500: '#12998E',
    600: '#0B7F76',
    700: '#0A665F',
    900: '#063C38',
  },
  /** 中性色「墨」（冷调） */
  ink: {
    50: '#F5F7F9',
    100: '#EEF1F4',
    200: '#E1E6EA',
    300: '#C4CCD3',
    400: '#95A1AB',
    500: '#6B7985',
    700: '#34434E',
    900: '#0E1A22',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** 语义色（§6.2.3）。price 仅用于价格数字。 */
export const semanticPalette = {
  light: {
    success: '#1E9E64',
    warning: '#D98A1C',
    danger: '#D6453D',
    info: '#2F7FD8',
    price: '#E14B35',
  },
  dark: {
    success: '#3CC484',
    warning: '#F0A94A',
    danger: '#F0685F',
    info: '#5B9DEB',
    price: '#F26A55',
  },
} as const;

/**
 * 数据可视化色（§6.2.5）。
 * 低饱和、同明度，区分度靠色相；**必须始终配合文字标签**，不可只靠颜色表意。
 */
export const vizPalette = [
  { token: 'viz-1', value: '#12998E', name: '息青' },
  { token: 'viz-2', value: '#5B7FD6', name: '雾蓝' },
  { token: 'viz-3', value: '#C7894B', name: '琥珀' },
  { token: 'viz-4', value: '#8C6BC7', name: '藕紫' },
  { token: 'viz-5', value: '#D0677A', name: '胭脂' },
  { token: 'viz-6', value: '#6F9E4F', name: '竹绿' },
] as const;

export type ColorSchemeName = 'light' | 'dark';

/**
 * 语义 token —— 组件唯一允许引用的颜色来源。
 *
 * 显式声明接口而非从字面量推导：深浅色两套缺任何一个键都会编译报错，
 * 同时避免字面量类型泄漏导致两套主题互不兼容。
 */
export interface SemanticColors {
  bg: string;
  surface: string;
  surfaceRaised: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** 品牌色底之上的文字 */
  textOnAccent: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  /** 页面底色之上的品牌色文字，对比度 ≥ 4.5（§6.2.1） */
  accentText: string;
  accentSubtle: string;
  skeleton: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** 仅用于价格数字（§6.2.3） */
  price: string;
}

/**
 * 与 `global.css` 中的 CSS 变量保持同源，供无法使用 className 的场景
 * （Skia 画布、原生 props、LinearGradient）读取。
 */
export const semanticColors: Record<ColorSchemeName, SemanticColors> = {
  light: {
    bg: palette.ink[50],
    surface: palette.white,
    surfaceRaised: palette.white,
    textPrimary: palette.ink[900],
    textSecondary: palette.ink[500],
    textTertiary: palette.ink[400],
    textOnAccent: palette.white,
    border: palette.ink[200],
    borderStrong: palette.ink[300],
    accent: palette.primary[500],
    accentPressed: palette.primary[600],
    accentText: palette.primary[600],
    accentSubtle: palette.primary[50],
    skeleton: palette.ink[100],
    ...semanticPalette.light,
  },
  dark: {
    bg: '#0A1217',
    surface: '#121D24',
    surfaceRaised: '#1A2730',
    textPrimary: '#EEF3F6',
    textSecondary: '#8E9BA5',
    textTertiary: '#6E7B85',
    textOnAccent: '#04201D',
    border: '#24323C',
    borderStrong: '#31424E',
    // 深色模式下提亮，保证对比度（§6.2.6）
    accent: '#2BB5A9',
    accentPressed: '#36B3A8',
    accentText: '#6FCBC2',
    accentSubtle: palette.primary[900],
    skeleton: '#1A2730',
    ...semanticPalette.dark,
  },
};

/**
 * 信号质量色（§6.2.4）。
 * 每一档都必须同时提供 颜色 + 图标格数 + 文案 —— 不允许只靠颜色表达状态（§1.3 原则 2）。
 */
export const signalColors = (scheme: ColorSchemeName) => ({
  good: semanticColors[scheme].accent,
  fair: semanticColors[scheme].warning,
  poor: semanticColors[scheme].danger,
});
