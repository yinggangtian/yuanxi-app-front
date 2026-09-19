import type { CartItem } from '../../api/schemas/order';

/**
 * 购物车金额计算（设计文档 §4.5.3 / §5.12）。
 *
 * ⚠️ 前端汇总金额**只作展示**，最终金额以服务端预订单计算结果为准。
 * 本模块保证展示口径一致且不出现浮点误差（全程以「分」为整数运算）。
 */

export interface CartTotals {
  /** 已选中的有效商品件数 */
  selectedQuantity: number;
  /** 已选中的有效商品种类数 */
  selectedKinds: number;
  /** 商品合计（分） */
  goodsAmount: number;
  /** 可结算 —— 至少选中一件有效商品 */
  canCheckout: boolean;
}

/** 失效商品永远不计入金额，也不可被选中。 */
export function isSelectable(item: CartItem): boolean {
  return !item.invalid;
}

export function calculateTotals(items: readonly CartItem[]): CartTotals {
  let selectedQuantity = 0;
  let selectedKinds = 0;
  let goodsAmount = 0;

  for (const item of items) {
    if (!isSelectable(item) || !item.selected) continue;
    selectedQuantity += item.quantity;
    selectedKinds += 1;
    goodsAmount += item.price * item.quantity;
  }

  return {
    selectedQuantity,
    selectedKinds,
    goodsAmount,
    canCheckout: selectedKinds > 0,
  };
}

/** 全选状态：仅针对有效商品；无有效商品时视为未全选。 */
export function isAllSelected(items: readonly CartItem[]): boolean {
  const selectable = items.filter(isSelectable);
  if (selectable.length === 0) return false;
  return selectable.every((item) => item.selected);
}

/**
 * 数量上限：同时受库存与限购约束（§4.5.3）。
 * 两者取较小值；无限购时只看库存。
 */
export function maxQuantityFor(item: CartItem): number {
  if (item.purchaseLimit === null) return item.stock;
  return Math.min(item.stock, item.purchaseLimit);
}

/** 夹取数量到 [1, max]，供 Stepper 使用。 */
export function clampQuantity(item: CartItem, next: number): number {
  const max = Math.max(1, maxQuantityFor(item));
  if (next < 1) return 1;
  if (next > max) return max;
  return next;
}

/** 有效商品与失效商品分区（§4.5.3 失效商品区）。 */
export function partitionItems(items: readonly CartItem[]): {
  valid: CartItem[];
  invalid: CartItem[];
} {
  const valid: CartItem[] = [];
  const invalid: CartItem[] = [];
  for (const item of items) {
    (item.invalid ? invalid : valid).push(item);
  }
  return { valid, invalid };
}
