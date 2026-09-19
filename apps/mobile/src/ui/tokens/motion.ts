import { Easing } from 'react-native-reanimated';

/**
 * 动效 token（设计文档 §6.7）。
 *
 * 开启系统「减弱动态效果」时：循环动画停止、转场改为淡入淡出
 * —— 由 `useReducedMotion()` 统一判断，见 src/ui/hooks/useReducedMotion.ts。
 */
export const duration = {
  /** 按压、切换 */
  fast: 120,
  /** 展开、淡入 */
  base: 220,
  /** 页面级、Sheet */
  slow: 360,
  /** 呼吸光晕、设备悬浮、分析中（循环） */
  breath: 4000,
  /** 蓝牙雷达扩散（循环） */
  radar: 2400,
} as const;

/** standard = cubic-bezier(0.2, 0, 0, 1) */
export const easingStandard = Easing.bezier(0.2, 0, 0, 1);
/** emphasized = cubic-bezier(0.3, 0, 0, 1) */
export const easingEmphasized = Easing.bezier(0.3, 0, 0, 1);
/** 呼吸动效用正弦曲线，避免机械感 */
export const easingBreath = Easing.inOut(Easing.sin);
export const easingRadar = Easing.out(Easing.quad);

/** 卡片弹出、数字跳动 */
export const springDefault = { damping: 18, stiffness: 180 } as const;

/** 数字滚动计数动画时长上限（§6.7）。 */
export const COUNT_UP_MAX_DURATION = 800;
