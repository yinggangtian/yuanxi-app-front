import { QueryClient } from '@tanstack/react-query';

import { staleTimes } from '../api/queryKeys';

/**
 * TanStack Query 客户端（设计文档 §5.8）。
 *
 * 默认策略：列表 30s、详情 5min；报告详情不可变，由各 hook 单独设为 Infinity。
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: staleTimes.list,
        gcTime: 24 * 60 * 60 * 1000,
        retry: 2,
        // 移动端频繁切前后台，聚焦即刷新会造成不必要的请求
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}
