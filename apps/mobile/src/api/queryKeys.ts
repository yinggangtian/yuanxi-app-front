import type { OrderStatus } from './schemas/order';

/**
 * Query Key 工厂（设计文档 §5.8）。
 *
 * 集中管理，避免各处手写字符串数组导致失效范围不可控。
 */
export const queryKeys = {
  me: {
    all: ['me'] as const,
    profile: () => [...queryKeys.me.all, 'profile'] as const,
    points: () => [...queryKeys.me.all, 'points'] as const,
    badges: () => [...queryKeys.me.all, 'badges'] as const,
  },
  device: {
    all: ['devices'] as const,
    list: () => [...queryKeys.device.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.device.all, 'detail', id] as const,
    firmware: (id: string) => [...queryKeys.device.all, 'firmware', id] as const,
  },
  report: {
    all: ['reports'] as const,
    list: () => [...queryKeys.report.all, 'list'] as const,
    latest: () => [...queryKeys.report.all, 'latest'] as const,
    detail: (id: string) => ['report', id] as const,
    trend: (range: '7d' | '30d' | '90d') => [...queryKeys.report.all, 'trend', range] as const,
  },
  mall: {
    all: ['mall'] as const,
    home: () => [...queryKeys.mall.all, 'home'] as const,
    products: (categoryId?: string) => [...queryKeys.mall.all, 'products', categoryId ?? 'all'] as const,
    product: (id: string) => ['product', id] as const,
  },
  cart: {
    all: ['cart'] as const,
    list: () => [...queryKeys.cart.all, 'list'] as const,
  },
  order: {
    all: ['orders'] as const,
    list: (status: OrderStatus | 'all') => [...queryKeys.order.all, status] as const,
    detail: (id: string) => ['order', id] as const,
    payment: (id: string) => ['order', id, 'payment'] as const,
  },
  address: {
    all: ['address'] as const,
    list: () => [...queryKeys.address.all, 'list'] as const,
  },
} as const;

/**
 * 默认缓存策略（§5.8）。
 * 报告详情不可变 —— staleTime 设为 Infinity。
 */
export const staleTimes = {
  list: 30_000,
  detail: 5 * 60_000,
  immutable: Infinity,
} as const;
