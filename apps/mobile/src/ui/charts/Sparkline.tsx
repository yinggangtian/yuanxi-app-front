import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';

import { pointsToPath, seriesToPoints } from './geometry';
import { useTheme } from '../hooks/useTheme';

export interface SparklineProps {
  values: readonly number[];
  width: number;
  height?: number;
  color?: string;
  /** 末点圆点（§6.9） */
  showLastDot?: boolean;
  accessibilityLabel?: string;
}

/** 迷你趋势图（§6.9）：无坐标轴，1.5pt 线，末点圆点。 */
export function Sparkline({
  values,
  width,
  height = 40,
  color,
  showLastDot = true,
  accessibilityLabel,
}: SparklineProps) {
  const { colors } = useTheme();
  const strokeColor = color ?? colors.accent;

  // 留出末点圆点与线宽的空间，避免贴边裁切
  const padding = 4;
  const points = seriesToPoints(values, width, height, padding);
  const last = points[points.length - 1];

  if (points.length === 0) return <View style={{ width, height }} />;

  const path = Skia.Path.MakeFromSVGString(pointsToPath(points));

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `近 ${values.length} 次趋势`}
      accessibilityRole="image"
      style={{ width, height }}
    >
      <Canvas style={{ width, height }}>
        {path ? (
          <Path
            color={strokeColor}
            path={path}
            strokeCap="round"
            strokeJoin="round"
            strokeWidth={1.5}
            style="stroke"
          />
        ) : null}
        {showLastDot && last ? <Circle color={strokeColor} cx={last.x} cy={last.y} r={3} /> : null}
      </Canvas>
    </View>
  );
}
