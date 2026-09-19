import { useQuery } from '@tanstack/react-query';

import { queryKeys, staleTimes } from '../../api/queryKeys';
import type {
  Address,
  CheckoutPreview,
  OrderDetail,
  OrderStatus,
  OrderSummary,
} from '../../api/schemas/order';
import { mockAddresses, mockCheckoutPreview, mockOrderDetails, mockOrders } from '../../mocks';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useOrders(status: OrderStatus | 'all') {
  return useQuery({
    queryKey: queryKeys.order.list(status),
    queryFn: async (): Promise<OrderSummary[]> => {
      await delay(150);
      return status === 'all' ? mockOrders : mockOrders.filter((order) => order.status === status);
    },
    staleTime: staleTimes.list,
  });
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<OrderDetail | null> => {
      await delay(160);
      if (!id) return null;
      const detail = mockOrderDetails[id];
      if (detail) return detail;

      const summary = mockOrders.find((order) => order.id === id);
      if (!summary) return null;
      return {
        ...summary,
        address: mockAddresses[0] ?? null,
        goodsAmount: summary.payAmount,
        freightAmount: 0,
        discountAmount: 0,
        pointsDeduction: 0,
        remark: '',
        paidAt: null,
        logistics: [],
        logisticsCompany: null,
        logisticsNo: null,
      };
    },
    staleTime: staleTimes.detail,
  });
}

/** 各状态订单数量 —— 「我的」页快捷入口角标（§7.14）。 */
export function useOrderCounts(): Record<OrderStatus, number> {
  const counts = {
    'pending-payment': 0,
    'pending-shipment': 0,
    'pending-receipt': 0,
    completed: 0,
    cancelled: 0,
    'after-sales': 0,
  } as Record<OrderStatus, number>;

  for (const order of mockOrders) counts[order.status] += 1;
  return counts;
}

/**
 * 预订单（§4.5.4）。
 * ⚠️ 金额以此结果为准，前端购物车汇总只作展示（§4.5.3）。
 */
export function useCheckoutPreview() {
  return useQuery({
    queryKey: ['checkout', 'preview'],
    queryFn: async (): Promise<CheckoutPreview> => {
      await delay(180);
      return mockCheckoutPreview;
    },
    staleTime: 0,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.address.list(),
    queryFn: async (): Promise<Address[]> => {
      await delay(120);
      return mockAddresses;
    },
    staleTime: staleTimes.list,
  });
}
