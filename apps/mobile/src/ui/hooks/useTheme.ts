import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { semanticColors, signalColors, type ColorSchemeName, type SemanticColors } from '../tokens';

export interface Theme {
  scheme: ColorSchemeName;
  isDark: boolean;
  colors: SemanticColors;
  signal: ReturnType<typeof signalColors>;
}

/**
 * 深色模式跟随系统（设计文档 §4.7 / §6.2.6）。
 *
 * 供无法使用 className 的场景读取语义 token：Skia 画布、原生组件 props、
 * LinearGradient 等。普通视图请优先用 NativeWind 的 `dark:` 变体。
 */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return useMemo(
    () => ({
      scheme,
      isDark: scheme === 'dark',
      colors: semanticColors[scheme],
      signal: signalColors(scheme),
    }),
    [scheme],
  );
}
