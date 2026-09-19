import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { PAGE_PADDING, radius, shadow, spacing } from '../tokens';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger';

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** 顶部轻提示（§6.10），默认 2s 自动消失。 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'neutral') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  const toneColor: Record<ToastTone, string> = {
    neutral: colors.textPrimary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          entering={FadeInUp}
          exiting={FadeOutUp}
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: insets.top + spacing.xs,
              left: PAGE_PADDING,
              right: PAGE_PADDING,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: toneColor[toast.tone],
            },
            shadow('md'),
          ]}
        >
          <Text variant="body-sm">{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast 必须在 <ToastProvider> 内使用');
  return context;
}

/** 无 Provider 时的安全降级（供测试与早期页面使用）。 */
export function useOptionalToast(): ToastApi {
  const context = useContext(ToastContext);
  return context ?? { show: () => undefined };
}
