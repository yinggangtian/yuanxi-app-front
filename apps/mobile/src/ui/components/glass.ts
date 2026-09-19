import { Platform } from 'react-native';

/**
 * 磨砂玻璃降级判定（设计文档 §6.6 规则 4 / 5）。
 *
 * 低端 Android（API < 31）上实时模糊代价高且效果差，
 * 系统开启「降低透明度」时也必须降级 —— 两种情况都改用高不透明度纯色底，
 * **视觉层级保持不变**（仍是浮起的一层，只是不再透出背景）。
 *
 * 抽成纯函数以便单测覆盖，组件本身不再承载判定逻辑。
 */
export interface GlassDegradeInput {
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  /** Android API level；非 Android 平台传 undefined。 */
  androidApiLevel?: number;
  /** 系统「降低透明度」开关。 */
  reduceTransparency: boolean;
}

export function shouldDegradeGlass({
  platform,
  androidApiLevel,
  reduceTransparency,
}: GlassDegradeInput): boolean {
  if (reduceTransparency) return true;
  if (platform === 'android') {
    // API 31 (Android 12) 起才有可用的 RenderEffect 模糊
    return androidApiLevel === undefined || androidApiLevel < 31;
  }
  return false;
}

/** 当前运行环境是否需要降级。 */
export function shouldDegradeGlassHere(reduceTransparency: boolean): boolean {
  return shouldDegradeGlass({
    platform: Platform.OS,
    androidApiLevel: Platform.OS === 'android' ? Number(Platform.Version) : undefined,
    reduceTransparency,
  });
}

/** 玻璃表面规格（§6.6）。 */
export const GLASS_SPEC = {
  light: {
    blurTint: 'light' as const,
    translucentBackground: 'rgba(255,255,255,0.60)',
    /** 降级后的不透明底 —— 明度与玻璃态接近，层级不变 */
    opaqueBackground: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.70)',
  },
  dark: {
    blurTint: 'dark' as const,
    translucentBackground: 'rgba(18,29,36,0.55)',
    opaqueBackground: 'rgba(18,29,36,0.94)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
} as const;

/** 模糊强度 intensity 40 ≈ blur 24px（§6.6）。 */
export const GLASS_BLUR_INTENSITY = 40;
