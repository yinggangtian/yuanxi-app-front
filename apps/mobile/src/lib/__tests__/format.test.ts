import {
  formatCountdown,
  formatPrice,
  formatPriceCompact,
  formatRelativeDay,
  formatRemaining,
  greeting,
  maskPhone,
  maskSn,
} from '../format';

describe('formatPrice（金额以分流转，展示时转元）', () => {
  it('整元金额补两位小数并按千分位分组', () => {
    expect(formatPrice(129900)).toBe('¥1,299.00');
    expect(formatPrice(6800)).toBe('¥68.00');
  });

  it('角分正确展示', () => {
    expect(formatPrice(143550)).toBe('¥1,435.50');
    expect(formatPrice(5)).toBe('¥0.05');
  });

  it('零与负数', () => {
    expect(formatPrice(0)).toBe('¥0.00');
    expect(formatPrice(-500)).toBe('-¥5.00');
  });

  it('可省略货币符号', () => {
    expect(formatPrice(129900, false)).toBe('1,299.00');
  });

  it('紧凑格式在整元时省略小数', () => {
    expect(formatPriceCompact(129900)).toBe('¥1,299');
    expect(formatPriceCompact(143550)).toBe('¥1,435.50');
  });
});

describe('formatCountdown', () => {
  it('补零到 mm:ss', () => {
    expect(formatCountdown(892)).toBe('14:52');
    expect(formatCountdown(5)).toBe('00:05');
  });

  it('负数归零，不出现 -1:-1', () => {
    expect(formatCountdown(-10)).toBe('00:00');
  });

  it('超过一小时仍以分钟累计', () => {
    expect(formatCountdown(3700)).toBe('61:40');
  });
});

describe('formatRemaining', () => {
  it('依据截止时间计算剩余', () => {
    const now = Date.parse('2026-09-19T10:00:00Z');
    expect(formatRemaining('2026-09-19T10:14:52Z', now)).toBe('14:52');
  });

  it('已过期显示 00:00', () => {
    const now = Date.parse('2026-09-19T10:00:00Z');
    expect(formatRemaining('2026-09-19T09:00:00Z', now)).toBe('00:00');
  });

  it('无截止时间返回 null', () => {
    expect(formatRemaining(null)).toBeNull();
  });

  it('非法时间返回 null 而不是 NaN', () => {
    expect(formatRemaining('not-a-date')).toBeNull();
  });
});

describe('formatRelativeDay', () => {
  const now = new Date(2026, 8, 19, 10, 0, 0); // 2026-09-19 周六

  it('今天 / 昨天', () => {
    expect(formatRelativeDay(new Date(2026, 8, 19, 8, 12).toISOString(), now)).toBe('今天');
    expect(formatRelativeDay(new Date(2026, 8, 18, 8, 12).toISOString(), now)).toBe('昨天');
  });

  it('一周内显示星期', () => {
    expect(formatRelativeDay(new Date(2026, 8, 16).toISOString(), now)).toBe('周三');
  });

  it('超过一周显示日期', () => {
    expect(formatRelativeDay(new Date(2026, 8, 1).toISOString(), now)).toBe('9月1日');
  });
});

describe('greeting（§7.2 首页问候）', () => {
  it('按时段给出问候语', () => {
    expect(greeting(2)).toBe('夜深了');
    expect(greeting(8)).toBe('早上好');
    expect(greeting(12)).toBe('中午好');
    expect(greeting(16)).toBe('下午好');
    expect(greeting(21)).toBe('晚上好');
  });
});

describe('脱敏', () => {
  it('SN 只显示后四位', () => {
    expect(maskSn('YX2026A18F2A')).toBe('····8F2A');
    expect(maskSn('8F2A')).toBe('8F2A');
  });

  it('手机号中间四位打码', () => {
    expect(maskPhone('13800138000')).toBe('138****8000');
    expect(maskPhone('123')).toBe('123');
  });
});
