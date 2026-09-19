import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { palette, spacing } from '../tokens';

import { pointsToPath, seriesToPoints } from './geometry';

export interface TrendPoint {
  /** x 轴刻度文字，如「9/19」 */
  label: string;
  value: number;
}

export interface TrendChartProps {
  points: readonly TrendPoint[];
  width: number;
  height?: number;
  /** 参考区间（如健康评分 70–90），以 primary-50 色带显示（§6.9） */
  referenceBand?: { min: number; max: number };
  testID?: string;
}

/** x 轴最多 6 个刻度（§6.9）。 */
const MAX_TICKS = 6;

/** 趋势折线（设计文档 §6.9）：1.5pt 线，仅最新点显示数据点。 */
export function TrendChart({
  points,
  width,
  height = 120,
  referenceBand,
  testID,
}: TrendChartProps) {
  const { colors, isDark } = useTheme();

  const padding = 6;
  const values = points.map((point) => point.value);
  const coords = seriesToPoints(values, width, height, padding);
  const last = coords[coords.length - 1];
  const linePath = Skia.Path.MakeFromSVGString(pointsToPath(coords));

  // 只保留最多 6 个刻度，均匀抽取
  const tickStep = Math.max(1, Math.ceil(points.length / MAX_TICKS));
  const ticks = points.filter((_, index) => index % tickStep === 0);

  // 参考区间色带按数据极值映射到画布坐标
  const band = (() => {
    if (!referenceBand || values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    if (span === 0) return null;
    const innerHeight = height - padding * 2;
    const toY = (value: number) =>
      padding + innerHeight - ((value - min) / span) * innerHeight;
    const top = toY(Math.min(referenceBand.max, max));
    const bottom = toY(Math.max(referenceBand.min, min));
    return { top, height: Math.max(bottom - top, 0) };
  })();

  if (points.length === 0) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }} testID={testID}>
        <Text tone="tertiary" variant="caption">
          暂无趋势数据
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width }} testID={testID}>
      <View style={{ width, height }}>
        {band ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: band.top,
              height: band.height,
              backgroundColor: isDark ? colors.accentSubtle : palette.primary[50],
            }}
          />
        ) : null}

        <Canvas style={{ width, height }}>
          {linePath ? (
            <Path
              color={colors.accent}
              path={linePath}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={1.5}
              style="stroke"
            />
          ) : null}
          {last ? <Circle color={colors.accent} cx={last.x} cy={last.y} r={4} /> : null}
        </Canvas>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing.xxs,
        }}
      >
        {ticks.map((tick) => (
          <Text key={tick.label} tone="tertiary" variant="micro">
            {tick.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
