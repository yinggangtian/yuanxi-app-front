import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  duration,
  easingBreath,
  easingRadar,
  radius,
  useReducedMotion,
  useTheme,
} from '../../../ui';

export interface RadarScanProps {
  size?: number;
  /** 扫描是否进行中；蓝牙关闭时停止（§7.6） */
  active?: boolean;
  children?: React.ReactNode;
}

/** 波纹圈数（§4.4.1：3 圈错峰）。 */
const RIPPLE_COUNT = 3;

/**
 * 动态雷达扫描（设计文档 §4.4.1 / §7.6）。
 *
 * 以设备为中心的同心圆扩散波纹，3 圈错峰，2.4s 周期（motion-radar）。
 * 系统「减弱动态效果」时停止循环（§6.7）。
 */
export function RadarScan({ size = 280, active = true, children }: RadarScanProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <View
      accessibilityLabel={active ? '正在搜索附近的脉搏环' : '搜索已暂停'}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {Array.from({ length: RIPPLE_COUNT }, (_, index) => (
        <Ripple
          active={active && !reducedMotion}
          color={colors.accent}
          delayMs={(duration.radar / RIPPLE_COUNT) * index}
          key={index}
          size={size}
        />
      ))}

      {/* 设备主视觉 */}
      <DeviceFloat active={active && !reducedMotion}>{children}</DeviceFloat>
    </View>
  );
}

function Ripple({
  size,
  color,
  delayMs,
  active,
}: {
  size: number;
  color: string;
  delayMs: number;
  active: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: duration.radar, easing: easingRadar }), -1, false),
    );
  }, [active, delayMs, progress]);

  const style = useAnimatedStyle(() => ({
    // 由内向外扩散并淡出
    transform: [{ scale: 0.35 + progress.value * 0.65 }],
    opacity: (1 - progress.value) * 0.5,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius.full,
          borderWidth: 1.5,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

/** 设备悬浮：±6pt，4s 呼吸周期（§5.9）。 */
function DeviceFloat({ active, children }: { active: boolean; children?: React.ReactNode }) {
  const { colors } = useTheme();
  const float = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      float.value = 0.5;
      return;
    }
    float.value = withRepeat(
      withTiming(1, { duration: duration.breath, easing: easingBreath }),
      -1,
      true,
    );
  }, [active, float]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 + float.value * 12 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + float.value * 0.12,
    transform: [{ scaleX: 1 - float.value * 0.15 }],
  }));

  return (
    <>
      <Animated.View style={bodyStyle}>
        {children ?? (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radius.full,
              borderWidth: 10,
              borderColor: colors.accentSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.full,
                borderWidth: 2.5,
                borderColor: colors.accent,
              }}
            />
          </View>
        )}
      </Animated.View>

      {/* 底部柔光投影，随浮动缩放（§5.9） */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 54,
            width: 72,
            height: 8,
            borderRadius: radius.full,
            backgroundColor: colors.textPrimary,
          },
          shadowStyle,
        ]}
      />
    </>
  );
}
