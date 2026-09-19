import type { CartItem } from '../../../api/schemas/order';
import {
  calculateTotals,
  clampQuantity,
  isAllSelected,
  maxQuantityFor,
  partitionItems,
} from '../cartMath';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'ci_1',
  productId: 'p_1',
  skuId: 'sku_1',
  title: '测试商品',
  skuName: '标准版',
  imageUrl: '',
  price: 10000,
  quantity: 1,
  stock: 10,
  purchaseLimit: null,
  selected: true,
  invalid: false,
  invalidReason: null,
  ...overrides,
});

describe('购物车金额汇总（§4.5.3）', () => {
  it('只统计已选中的有效商品', () => {
    const totals = calculateTotals([
      item({ id: 'a', price: 129900, quantity: 1, selected: true }),
      item({ id: 'b', price: 6800, quantity: 2, selected: true }),
      item({ id: 'c', price: 50000, quantity: 1, selected: false }),
    ]);

    expect(totals.selectedKinds).toBe(2);
    expect(totals.selectedQuantity).toBe(3);
    expect(totals.goodsAmount).toBe(129900 + 6800 * 2);
    expect(totals.canCheckout).toBe(true);
  });

  it('失效商品即使 selected 为 true 也不计入', () => {
    const totals = calculateTotals([
      item({ id: 'a', price: 10000, selected: true, invalid: true }),
      item({ id: 'b', price: 20000, selected: true }),
    ]);

    expect(totals.goodsAmount).toBe(20000);
    expect(totals.selectedKinds).toBe(1);
  });

  it('全程整数运算，不产生浮点误差', () => {
    // 0.1 + 0.2 类问题在以「元」为单位时会出现
    const totals = calculateTotals([
      item({ id: 'a', price: 10, quantity: 1 }),
      item({ id: 'b', price: 20, quantity: 1 }),
    ]);
    expect(totals.goodsAmount).toBe(30);
    expect(Number.isInteger(totals.goodsAmount)).toBe(true);
  });

  it('空购物车不可结算', () => {
    const totals = calculateTotals([]);
    expect(totals.goodsAmount).toBe(0);
    expect(totals.canCheckout).toBe(false);
  });

  it('只有失效商品时不可结算', () => {
    const totals = calculateTotals([item({ invalid: true })]);
    expect(totals.canCheckout).toBe(false);
  });
});

describe('全选判定', () => {
  it('全部有效商品选中才算全选', () => {
    expect(isAllSelected([item({ id: 'a' }), item({ id: 'b' })])).toBe(true);
    expect(isAllSelected([item({ id: 'a' }), item({ id: 'b', selected: false })])).toBe(false);
  });

  it('失效商品不影响全选判定', () => {
    expect(isAllSelected([item({ id: 'a' }), item({ id: 'b', invalid: true, selected: false })])).toBe(
      true,
    );
  });

  it('没有有效商品时不算全选', () => {
    expect(isAllSelected([])).toBe(false);
    expect(isAllSelected([item({ invalid: true })])).toBe(false);
  });
});

describe('数量上限（库存与限购同时约束）', () => {
  it('无限购时取库存', () => {
    expect(maxQuantityFor(item({ stock: 42, purchaseLimit: null }))).toBe(42);
  });

  it('有限购时取两者较小值', () => {
    expect(maxQuantityFor(item({ stock: 42, purchaseLimit: 2 }))).toBe(2);
    expect(maxQuantityFor(item({ stock: 1, purchaseLimit: 5 }))).toBe(1);
  });

  it('夹取到 [1, max]', () => {
    const target = item({ stock: 10, purchaseLimit: 3 });
    expect(clampQuantity(target, 0)).toBe(1);
    expect(clampQuantity(target, 2)).toBe(2);
    expect(clampQuantity(target, 99)).toBe(3);
  });

  it('库存为 0 时下限仍为 1，避免出现数量 0 的行', () => {
    expect(clampQuantity(item({ stock: 0 }), 1)).toBe(1);
  });
});

describe('失效商品分区（§4.5.3）', () => {
  it('按 invalid 分成两组，保持原顺序', () => {
    const { valid, invalid } = partitionItems([
      item({ id: 'a' }),
      item({ id: 'b', invalid: true }),
      item({ id: 'c' }),
    ]);

    expect(valid.map((entry) => entry.id)).toEqual(['a', 'c']);
    expect(invalid.map((entry) => entry.id)).toEqual(['b']);
  });
});
