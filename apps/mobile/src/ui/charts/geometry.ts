/**
 * 图表几何计算（设计文档 §6.9）。
 *
 * 纯函数，不依赖 Skia / React —— 便于单测覆盖，也便于在 worklet 中调用。
 */

export interface Point {
  x: number;
  y: number;
}

/** 角度转弧度。 */
export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * 极坐标转直角坐标。
 * 0° 指向正上方（12 点钟方向），顺时针为正 —— 与评分环、雷达图的读图习惯一致。
 */
export function polarToCartesian(
  center: Point,
  radius: number,
  angleDegrees: number,
): Point {
  const radians = toRadians(angleDegrees - 90);
  return {
    x: center.x + radius * Math.cos(radians),
    y: center.y + radius * Math.sin(radians),
  };
}

/** 把任意数值夹取到 [min, max]。 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * 评分环（§6.9）：270° 开口环，缺口朝下。
 * 起始角 -135°（左下），扫过 270° 至 +135°（右下）。
 */
export const SCORE_RING_START_ANGLE = -135;
export const SCORE_RING_SWEEP = 270;

/** 评分（0–100）映射为环形扫过的角度。 */
export function scoreToSweepAngle(score: number, max = 100): number {
  if (max <= 0) return 0;
  return (clamp(score, 0, max) / max) * SCORE_RING_SWEEP;
}

/**
 * 雷达图顶点坐标（§6.9：6 轴）。
 * @param values 各轴取值，与 `axisCount` 等长
 * @param maxValue 各轴满值
 */
export function radarPolygonPoints(
  center: Point,
  radius: number,
  values: readonly number[],
  maxValue = 100,
): Point[] {
  const axisCount = values.length;
  if (axisCount === 0) return [];
  const step = 360 / axisCount;

  return values.map((value, index) => {
    const ratio = maxValue > 0 ? clamp(value, 0, maxValue) / maxValue : 0;
    return polarToCartesian(center, radius * ratio, index * step);
  });
}

/** 雷达图各轴端点（用于画轴线与标签定位）。 */
export function radarAxisPoints(center: Point, radius: number, axisCount: number): Point[] {
  if (axisCount <= 0) return [];
  const step = 360 / axisCount;
  return Array.from({ length: axisCount }, (_, index) =>
    polarToCartesian(center, radius, index * step),
  );
}

/**
 * 把一组数值映射为折线/迷你图的坐标点。
 *
 * 纵向按数据的实际极值归一化；当所有值相等时落在中线，避免除零。
 */
export function seriesToPoints(
  values: readonly number[],
  width: number,
  height: number,
  padding = 0,
): Point[] {
  if (values.length === 0) return [];

  const innerWidth = Math.max(width - padding * 2, 0);
  const innerHeight = Math.max(height - padding * 2, 0);

  if (values.length === 1) {
    return [{ x: padding + innerWidth / 2, y: padding + innerHeight / 2 }];
  }

  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const span = max - min;
  const stepX = innerWidth / (values.length - 1);

  return values.map((value, index) => ({
    x: padding + index * stepX,
    // span 为 0 时落在中线
    y: padding + (span === 0 ? innerHeight / 2 : innerHeight - ((value - min) / span) * innerHeight),
  }));
}

/** 把坐标点串成 SVG/Skia path 字符串。 */
export function pointsToPath(points: readonly Point[], closed = false): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (!first) return '';

  const segments = [`M ${first.x} ${first.y}`];
  for (const point of rest) segments.push(`L ${point.x} ${point.y}`);
  if (closed) segments.push('Z');
  return segments.join(' ');
}

/**
 * 波形降采样（§5.6 性能要点 2）。
 *
 * 点数超过屏幕像素数时按 min/max 成对保留，**保住峰值形态**
 * —— 直接抽稀会把脉搏波的峰谷抹平，是波形图最常见的失真来源。
 */
export function downsampleMinMax(
  samples: ArrayLike<number>,
  targetPoints: number,
): number[] {
  const length = samples.length;
  if (length === 0 || targetPoints <= 0) return [];
  if (length <= targetPoints) return Array.from(samples as ArrayLike<number>);

  // 每个桶产出 min、max 两个点
  const bucketCount = Math.max(Math.floor(targetPoints / 2), 1);
  const bucketSize = length / bucketCount;
  const result: number[] = [];

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = Math.floor(bucket * bucketSize);
    const end = Math.min(Math.floor((bucket + 1) * bucketSize), length);
    if (start >= end) continue;

    let min = Infinity;
    let max = -Infinity;
    let minIndex = start;
    let maxIndex = start;

    for (let i = start; i < end; i += 1) {
      const value = samples[i] as number;
      if (value < min) {
        min = value;
        minIndex = i;
      }
      if (value > max) {
        max = value;
        maxIndex = i;
      }
    }

    // 按原始时间顺序输出，波形才不会左右翻折
    if (minIndex <= maxIndex) result.push(min, max);
    else result.push(max, min);
  }

  return result;
}
