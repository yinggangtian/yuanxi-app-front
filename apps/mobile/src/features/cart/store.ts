import { create } from 'zustand';

import { clampQuantity, isAllSelected, isSelectable } from './cartMath';
import type { CartItem } from '../../api/schemas/order';
import { mockCartItems } from '../../mocks';


/**
 * 购物车状态。
 *
 * 当前以本地 mock 驱动；接入服务端后改为 TanStack Query +
 * 乐观更新（§4.5.3：数量增减乐观更新，失败回滚），
 * 本 store 退化为「选中态」等纯客户端状态。
 */
interface CartState {
  items: CartItem[];
  setQuantity: (id: string, quantity: number) => void;
  toggleSelected: (id: string) => void;
  toggleAll: () => void;
  remove: (id: string) => void;
  clearInvalid: () => void;
  addItem: (item: CartItem) => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: mockCartItems,

  setQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: clampQuantity(item, quantity) } : item,
      ),
    })),

  toggleSelected: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        // 失效商品不可选中
        item.id === id && isSelectable(item) ? { ...item, selected: !item.selected } : item,
      ),
    })),

  toggleAll: () =>
    set((state) => {
      const next = !isAllSelected(state.items);
      return {
        items: state.items.map((item) =>
          isSelectable(item) ? { ...item, selected: next } : item,
        ),
      };
    }),

  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearInvalid: () => set((state) => ({ items: state.items.filter((item) => !item.invalid) })),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.skuId === item.skuId);
      if (!existing) return { items: [...state.items, item] };
      return {
        items: state.items.map((entry) =>
          entry.skuId === item.skuId
            ? { ...entry, quantity: clampQuantity(entry, entry.quantity + item.quantity) }
            : entry,
        ),
      };
    }),
}));

/** 商城 Tab 角标：有效商品件数（§2.1）。 */
export function useCartBadge(): number {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => (item.invalid ? sum : sum + item.quantity), 0),
  );
}
