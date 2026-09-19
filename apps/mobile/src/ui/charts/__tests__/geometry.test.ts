import {
  clamp,
  downsampleMinMax,
  pointsToPath,
  polarToCartesian,
  radarAxisPoints,
  radarPolygonPoints,
  SCORE_RING_SWEEP,
  scoreToSweepAngle,
  seriesToPoints,
} from '../geometry';

const CENTER = { x: 100, y: 100 };
const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 5);

describe('polarToCartesian', () => {
  it('0° 指向正上方', () => {
    const point = polarToCartesian(CENTER, 50, 0);
    near(point.x, 100);
    near(point.y, 50);
  });

  it('90° 指向正右方（顺时针）', () => {
    const point = polarToCartesian(CENTER, 50, 90);
    near(point.x, 150);
    near(point.y, 100);
  });

  it('180° 指向正下方', () => {
    const point = polarToCartesian(CENTER, 50, 180);
    near(point.x, 100);
    near(point.y, 150);
  });
});

describe('clamp', () => {
  it('夹取到区间内', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('NaN 退化为下界，避免污染后续几何计算', () => {
    expect(clamp(Number.NaN, 0, 10)).toBe(0);
  });
});

describe('scoreToSweepAngle（§6.9 评分环 270° 开口）', () => {
  it('0 分不扫过', () => {
    expect(scoreToSweepAngle(0)).toBe(0);
  });

  it('满分扫满 270°', () => {
    expect(scoreToSweepAngle(100)).toBe(SCORE_RING_SWEEP);
  });

  it('中间值线性映射', () => {
    expect(scoreToSweepAngle(50)).toBeCloseTo(135);
    expect(scoreToSweepAngle(86)).toBeCloseTo(232.2);
  });

  it('越界分数被夹取', () => {
    expect(scoreToSweepAngle(120)).toBe(SCORE_RING_SWEEP);
    expect(scoreToSweepAngle(-10)).toBe(0);
  });

  it('max 非法时返回 0 而不是 NaN/Infinity', () => {
    expect(scoreToSweepAngle(50, 0)).toBe(0);
  });
});

describe('雷达图（§6.9：6 轴）', () => {
  it('满值顶点落在半径上', () => {
    const points = radarPolygonPoints(CENTER, 60, [100, 100, 100, 100, 100, 100]);
    expect(points).toHaveLength(6);
    near(points[0]!.x, 100);
    near(points[0]!.y, 40);
  });

  it('取值按比例收缩到中心', () => {
    const points = radarPolygonPoints(CENTER, 60, [50, 0, 0, 0, 0, 0]);
    near(points[0]!.y, 70);
    // 0 值落在圆心
    near(points[1]!.x, 100);
    near(points[1]!.y, 100);
  });

  it('空数据返回空数组', () => {
    expect(radarPolygonPoints(CENTER, 60, [])).toEqual([]);
    expect(radarAxisPoints(CENTER, 60, 0)).toEqual([]);
  });

  it('轴端点数量与轴数一致', () => {
    expect(radarAxisPoints(CENTER, 60, 6)).toHaveLength(6);
  });
});

describe('seriesToPoints', () => {
  it('首尾贴合左右边界', () => {
    const points = seriesToPoints([1, 2, 3], 100, 50);
    expect(points).toHaveLength(3);
    near(points[0]!.x, 0);
    near(points[2]!.x, 100);
  });

  it('最大值在顶部、最小值在底部（y 轴向下）', () => {
    const points = seriesToPoints([1, 3], 100, 50);
    near(points[0]!.y, 50);
    near(points[1]!.y, 0);
  });

  it('全部相等时落在中线，不产生除零', () => {
    const points = seriesToPoints([7, 7, 7], 100, 50);
    for (const point of points) near(point.y, 25);
  });

  it('单点居中', () => {
    const points = seriesToPoints([42], 100, 50);
    expect(points).toEqual([{ x: 50, y: 25 }]);
  });

  it('空数据返回空数组', () => {
    expect(seriesToPoints([], 100, 50)).toEqual([]);
  });

  it('padding 内缩绘图区', () => {
    const points = seriesToPoints([1, 2], 100, 50, 10);
    near(points[0]!.x, 10);
    near(points[1]!.x, 90);
  });
});

describe('pointsToPath', () => {
  it('生成 M/L 指令', () => {
    expect(pointsToPath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe('M 0 0 L 10 5');
  });

  it('闭合路径追加 Z', () => {
    expect(pointsToPath([{ x: 0, y: 0 }, { x: 10, y: 5 }], true)).toBe('M 0 0 L 10 5 Z');
  });

  it('空点集返回空串', () => {
    expect(pointsToPath([])).toBe('');
  });
});

describe('downsampleMinMax（§5.6：降采样须保住峰值）', () => {
  it('点数不足时原样返回', () => {
    expect(downsampleMinMax([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });

  it('保留全局极值，不把峰谷抹平', () => {
    const samples = [0, 0, 0, 100, 0, 0, -100, 0, 0, 0, 0, 0];
    const result = downsampleMinMax(samples, 6);
    expect(Math.max(...result)).toBe(100);
    expect(Math.min(...result)).toBe(-100);
  });

  it('输出点数不超过目标点数', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 10));
    const result = downsampleMinMax(samples, 200);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('同一桶内按原始时间顺序输出，波形不左右翻折', () => {
    // 桶内先出现最大值、后出现最小值 → 输出应为 [max, min]
    expect(downsampleMinMax([5, -5], 2)).toEqual([5, -5]);
    // 反之为 [min, max]
    expect(downsampleMinMax([-5, 5], 2)).toEqual([-5, 5]);
  });

  it('边界输入安全', () => {
    expect(downsampleMinMax([], 10)).toEqual([]);
    expect(downsampleMinMax([1, 2, 3], 0)).toEqual([]);
  });

  it('支持 Float32Array（BLE 解码后的实际类型）', () => {
    const samples = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = downsampleMinMax(samples, 4);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(Math.max(...result)).toBe(8);
  });
});
