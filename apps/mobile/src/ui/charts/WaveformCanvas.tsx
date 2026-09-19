import { Canvas, Circle, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { palette, radius } from '../tokens';

export interface WaveformCanvasProps {
  /**
   * 波形样本窗口（通常为最近 5s）。
   *
   * **必须传 SharedValue，不能传普通数组**（设计文档 §5.6 要点 3）：
   * 样本以 ~25Hz 批量写入，走 React state 会让整棵树每秒重渲染 25 次。
   */
  samples: SharedValue<number[]>;
  width: number;
  height?: number;
  /** 信号差时线色切为 signal-poor 且透明度 60%（§6.9） */
  degraded?: boolean;
  /** 深色背景（测量页）下的配色 */
  onDark?: boolean;
  /** 横向网格线条数，默认 5（§6.9） */
  gridLines?: number;
}

/** 样本取值域：协议解码后已归一化到 [-1, 1]。 */
const SAMPLE_MIN = -1;
const SAMPLE_MAX = 1;

/**
 * 实时脉搏波形（设计文档 §6.9 / §5.6）。
 *
 * 路径在 `useDerivedValue` 中生成 —— 运行在 UI 线程的 worklet 里，
 * JS 线程不参与每帧绘制，从而满足「测量页 ≥55fps（P95）」的指标（§5.11）。
 */
export function WaveformCanvas({
  samples,
  width,
  height = 180,
  degraded = false,
  onDark = false,
  gridLines = 5,
}: WaveformCanvasProps) {
  const { colors } = useTheme();

  const lineColor = degraded ? colors.danger : onDark ? palette.primary[300] : colors.accent;
  const gridColor = onDark ? 'rgba(255,255,255,0.08)' : palette.ink[200];

  const path = useDerivedValue<SkPath>(() => {
    'worklet';
    const skPath = Skia.Path.Make();
    const values = samples.value;
    const count = values.length;
    if (count < 2) return skPath;

    const stepX = width / (count - 1);
    const range = SAMPLE_MAX - SAMPLE_MIN;

    for (let index = 0; index < count; index += 1) {
      const raw = values[index] ?? 0;
      const clamped = raw < SAMPLE_MIN ? SAMPLE_MIN : raw > SAMPLE_MAX ? SAMPLE_MAX : raw;
      const x = index * stepX;
      // y 轴向下：取值越大越靠上
      const y = height - ((clamped - SAMPLE_MIN) / range) * height;
      if (index === 0) skPath.moveTo(x, y);
      else skPath.lineTo(x, y);
    }

    return skPath;
  }, [width, height]);

  /** 最新点发光圆点（§6.9）。 */
  const lastPoint = useDerivedValue(() => {
    'worklet';
    const values = samples.value;
    const count = values.length;
    if (count === 0) return { x: 0, y: height / 2, visible: false };

    const raw = values[count - 1] ?? 0;
    const clamped = raw < SAMPLE_MIN ? SAMPLE_MIN : raw > SAMPLE_MAX ? SAMPLE_MAX : raw;
    return {
      x: width,
      y: height - ((clamped - SAMPLE_MIN) / (SAMPLE_MAX - SAMPLE_MIN)) * height,
      visible: true,
    };
  }, [width, height]);

  const lastX = useDerivedValue(() => lastPoint.value.x);
  const lastY = useDerivedValue(() => lastPoint.value.y);

  const gridPath = useMemo(() => {
    const skPath = Skia.Path.Make();
    for (let index = 1; index < gridLines; index += 1) {
      const y = (height / gridLines) * index;
      skPath.moveTo(0, y);
      skPath.lineTo(width, y);
    }
    return skPath;
  }, [gridLines, height, width]);

  return (
    <View
      accessibilityLabel="实时脉搏波形"
      accessibilityRole="image"
      style={{
        width,
        height,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: onDark ? 'transparent' : palette.ink[50],
      }}
    >
      <Canvas style={{ width, height }}>
        {/* 网格线 0.5pt（§6.9） */}
        <Path color={gridColor} path={gridPath} strokeWidth={0.5} style="stroke" />

        <Path
          color={lineColor}
          opacity={degraded ? 0.6 : 1}
          path={path}
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={2}
          style="stroke"
        />

        <Circle color={lineColor} cx={lastX} cy={lastY} opacity={degraded ? 0.6 : 1} r={3} />
      </Canvas>
    </View>
  );
}
