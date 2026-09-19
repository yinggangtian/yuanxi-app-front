import { shouldDegradeGlass } from '../glass';

describe('磨砂玻璃降级判定（§6.6）', () => {
  it('iOS 默认使用真实模糊', () => {
    expect(shouldDegradeGlass({ platform: 'ios', reduceTransparency: false })).toBe(false);
  });

  it('系统开启「降低透明度」时，任何平台都降级', () => {
    expect(shouldDegradeGlass({ platform: 'ios', reduceTransparency: true })).toBe(true);
    expect(
      shouldDegradeGlass({ platform: 'android', androidApiLevel: 34, reduceTransparency: true }),
    ).toBe(true);
  });

  it('Android 12（API 31）及以上支持模糊，不降级', () => {
    expect(
      shouldDegradeGlass({ platform: 'android', androidApiLevel: 31, reduceTransparency: false }),
    ).toBe(false);
    expect(
      shouldDegradeGlass({ platform: 'android', androidApiLevel: 34, reduceTransparency: false }),
    ).toBe(false);
  });

  it('Android 11（API 30）及以下降级为不透明底', () => {
    expect(
      shouldDegradeGlass({ platform: 'android', androidApiLevel: 30, reduceTransparency: false }),
    ).toBe(true);
  });

  it('Android API 未知时保守降级', () => {
    expect(shouldDegradeGlass({ platform: 'android', reduceTransparency: false })).toBe(true);
  });
});
