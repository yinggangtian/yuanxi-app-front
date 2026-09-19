import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';

import { pointsToPath, radarAxisPoints, radarPolygonPoints } from './geometry';

export interface RadarAxis {
  /** 轴标签，如「脉率」 */
  label: string;
  /** 归一化取值 0–100 */
  value: number;
}

export interface PulseRadarProps {
  axes: readonly RadarAxis[];
  size?: number;
  /** 参考环层数，默认 3（§6.9） */
  rings?: number;
  testID?: string;
}

/**
 * 多维脉象雷达图（设计文档 §6.9 / §4.3.2）。
 *
 * 6 轴、3 层参考环（ink-200 虚线）；填充 primary-500 16% + 2pt 描边。
 * 轴标签用 caption 字号绘制在 Canvas 之外的绝对定位层，保证字体与无障碍缩放一致。
 */
export function PulseRadar({ axes, size = 220, rings = 3, testID }: PulseRadarProps) {
  const { colors } = useTheme();

  // 预留轴标签的空间
  const labelInset = 28;
  const radius = size / 2 - labelInset;
  const center = { x: size / 2, y: size / 2 };

  const values = axes.map((axis) => axis.value);
  const polygon = radarPolygonPoints(center, radius, values);
  const axisEnds = radarAxisPoints(center, radius, axes.length);
  const labelAnchors = radarAxisPoints(center, radius + labelInset * 0.62, axes.length);

  const polygonPath = Skia.Path.MakeFromSVGString(pointsToPath(polygon, true));

  const summary = axes.map((axis) => `${axis.label} ${Math.round(axis.value)}`).join('，');

  return (
    <View
      accessibilityLabel={`脉象多维指标：${summary}`}
      accessibilityRole="image"
      style={{ width: size, height: size }}
      testID={testID}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group>
          {/* 参考环：由外向内 rings 层 */}
          {Array.from({ length: rings }, (_, index) => {
            const ratio = (index + 1) / rings;
            const ringPoints = radarPolygonPoints(
              center,
              radius,
              axes.map(() => ratio * 100),
            );
            const ringPath = Skia.Path.MakeFromSVGString(pointsToPath(ringPoints, true));
            if (!ringPath) return null;
            return (
              <Path
                color={colors.border}
                key={`ring-${index}`}
                path={ringPath}
                strokeWidth={1}
                style="stroke"
              />
            );
          })}

          {/* 轴线 */}
          {axisEnds.map((end, index) => {
            const axisPath = Skia.Path.MakeFromSVGString(pointsToPath([center, end]));
            if (!axisPath) return null;
            return (
              <Path
                color={colors.border}
                key={`axis-${index}`}
                path={axisPath}
                strokeWidth={1}
                style="stroke"
              />
            );
          })}

          {/* 数据多边形：16% 填充 + 2pt 描边 */}
          {polygonPath ? (
            <>
              <Path color={colors.accent} opacity={0.16} path={polygonPath} style="fill" />
              <Path
                color={colors.accent}
                path={polygonPath}
                strokeJoin="round"
                strokeWidth={2}
                style="stroke"
              />
            </>
          ) : null}
        </Group>
      </Canvas>

      {/* 轴标签 —— 放在 Canvas 之上，跟随系统字体设置 */}
      {axes.map((axis, index) => {
        const anchor = labelAnchors[index];
        if (!anchor) return null;
        return (
          <View
            key={axis.label}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: anchor.x - labelInset,
              top: anchor.y - 9,
              width: labelInset * 2,
              alignItems: 'center',
            }}
          >
            <Text tone="secondary" variant="caption">
              {axis.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
