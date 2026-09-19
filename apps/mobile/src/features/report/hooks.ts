import { useQuery } from '@tanstack/react-query';

import { queryKeys, staleTimes } from '../../api/queryKeys';
import type { ReportDetail, ReportSummary, TrendPoint } from '../../api/schemas/report';
import { mockRecentScores, mockReportDetail, mockReportSummaries, mockTrend } from '../../mocks';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 报告列表（§4.3.1）。 */
export function useReportList() {
  return useQuery({
    queryKey: queryKeys.report.list(),
    queryFn: async (): Promise<ReportSummary[]> => {
      await delay(160);
      return mockReportSummaries;
    },
    staleTime: staleTimes.list,
  });
}

/** 最新一份报告 —— 首页今日脉诊卡使用。 */
export function useLatestReport() {
  return useQuery({
    queryKey: queryKeys.report.latest(),
    queryFn: async (): Promise<ReportSummary | null> => {
      await delay(120);
      return mockReportSummaries[0] ?? null;
    },
    staleTime: staleTimes.list,
  });
}

/**
 * 报告详情。
 * 报告内容生成后不再变化，因此 staleTime 设为 Infinity（§5.8）。
 */
export function useReportDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.report.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<ReportDetail> => {
      await delay(180);
      const summary = mockReportSummaries.find((report) => report.id === id);
      // 演示数据只准备了一份完整详情，其余复用结构、替换摘要字段
      return summary ? { ...mockReportDetail, ...summary } : mockReportDetail;
    },
    staleTime: staleTimes.immutable,
  });
}

/** 趋势（§4.3.1）。 */
export function useTrend(range: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: queryKeys.report.trend(range),
    queryFn: async (): Promise<TrendPoint[]> => {
      await delay(140);
      return mockTrend;
    },
    staleTime: staleTimes.list,
  });
}

/** 首页 sparkline 用的近 7 次评分（§7.2）。 */
export function useRecentScores(): number[] {
  return mockRecentScores;
}

/** 今日是否已完成脉诊 —— 决定首页主卡形态（§4.1）。 */
export function useMeasuredToday(): boolean {
  const { data } = useLatestReport();
  if (!data) return false;

  const measured = new Date(data.measuredAt);
  const now = new Date();
  return (
    measured.getFullYear() === now.getFullYear() &&
    measured.getMonth() === now.getMonth() &&
    measured.getDate() === now.getDate()
  );
}
