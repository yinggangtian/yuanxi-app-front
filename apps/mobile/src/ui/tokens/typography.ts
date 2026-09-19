import type { TextStyle } from 'react-native';

/**
 * 字号阶梯（设计文档 §6.3）。
 *
 * - 所有数值（评分、脉率、价格、电量、倒计时）走 `numeric` 族：
 *   Inter + tabular-nums，防止数字跳动时宽度抖动。
 * - 字重只用 400 / 500 / 600，不用 700+（极简感来自克制）。
 */
export type TypographyToken =
  | 'display'
  | 'metric-lg'
  | 'metric'
  | 'title-1'
  | 'title-2'
  | 'title-3'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'micro';

/** 数字/英文字体族：随包内置 Inter（仅数字与拉丁子集）。 */
export const numericFontFamily = 'Inter-SemiBold';

/** 数值类 token —— 使用等宽数字。 */
const NUMERIC_TOKENS = new Set<TypographyToken>(['display', 'metric-lg', 'metric']);

export const isNumericToken = (token: TypographyToken): boolean => NUMERIC_TOKENS.has(token);

type TypographySpec = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'> & {
  /** 动态字体最大放大倍数（§6.3）：正文 1.3，数据类大数字 1.1。 */
  maxFontSizeMultiplier: number;
};

export const typography: Record<TypographyToken, TypographySpec> = {
  display: { fontSize: 56, lineHeight: 60, fontWeight: '600', maxFontSizeMultiplier: 1.1 },
  'metric-lg': { fontSize: 40, lineHeight: 44, fontWeight: '600', maxFontSizeMultiplier: 1.1 },
  metric: { fontSize: 24, lineHeight: 28, fontWeight: '600', maxFontSizeMultiplier: 1.1 },
  'title-1': { fontSize: 26, lineHeight: 34, fontWeight: '600', maxFontSizeMultiplier: 1.3 },
  'title-2': { fontSize: 20, lineHeight: 28, fontWeight: '600', maxFontSizeMultiplier: 1.3 },
  'title-3': { fontSize: 17, lineHeight: 24, fontWeight: '600', maxFontSizeMultiplier: 1.3 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', maxFontSizeMultiplier: 1.3 },
  'body-sm': { fontSize: 14, lineHeight: 22, fontWeight: '400', maxFontSizeMultiplier: 1.3 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400', maxFontSizeMultiplier: 1.3 },
  /** 图表坐标、角标 —— 设计系统允许的最小字号。 */
  micro: { fontSize: 10, lineHeight: 14, fontWeight: '500', maxFontSizeMultiplier: 1.3 },
};

/** 组装某个字号 token 的完整 TextStyle。 */
export function typographyStyle(token: TypographyToken): TextStyle {
  const { maxFontSizeMultiplier: _ignored, ...style } = typography[token];
  if (!isNumericToken(token)) return style;
  return { ...style, fontFamily: numericFontFamily, fontVariant: ['tabular-nums'] };
}
