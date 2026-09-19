import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useTrend } from '@/features/report';
import {
  Card,
  EmptyState,
  PAGE_PADDING,
  Screen,
  SectionGap,
  SegmentedTabs,
  Skeleton,
  Text,
  TrendChart,
  spacing,
} from '@/ui';

type Range = '7d' | '30d' | '90d';

const RANGE_ITEMS = [
  { key: '7d', label: '7 天' },
  { key: '30d', label: '30 天' },
  { key: '90d', label: '90 天' },
];

/** 趋势页（设计文档 §4.3.1）。 */
export default function TrendScreen() {
  const [range, setRange] = useState<Range>('30d');
  const { data: points, isLoading } = useTrend(range);
  const { width } = useWindowDimensions();

  const chartWidth = width - PAGE_PADDING * 2 - spacing.md * 2;
  const scores = (points ?? []).map((point) => point.score);

  const stats =
    scores.length > 0
      ? {
          average: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
          max: Math.max(...scores),
          min: Math.min(...scores),
        }
      : null;

  return (
    <Screen>
      <SegmentedTabs
        items={RANGE_ITEMS}
        onChange={(key) => setRange(key as Range)}
        value={range}
      />

      <SectionGap size={spacing.md} />

      {isLoading ? (
        <Card>
          <Skeleton height={140} />
        </Card>
      ) : !points || points.length === 0 ? (
        <EmptyState description="完成更多脉诊后即可查看趋势变化。" title="暂无趋势数据" />
      ) : (
        <>
          <Card>
            <Text style={{ marginBottom: spacing.sm }} variant="title-3">
              综合健康评分
            </Text>
            <TrendChart
              height={160}
              points={points.map((point) => ({ label: point.label, value: point.score }))}
              referenceBand={{ min: 70, max: 90 }}
              width={chartWidth}
            />
            <Text style={{ marginTop: spacing.xs }} tone="tertiary" variant="caption">
              浅色区带为 70–90 分参考区间
            </Text>
          </Card>

          <SectionGap size={spacing.md} />

          {stats ? (
            <Card style={{ flexDirection: 'row' }}>
              <StatCell label="平均" value={stats.average} />
              <StatCell label="最高" value={stats.max} />
              <StatCell label="最低" value={stats.min} />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="metric">{value}</Text>
      <Text tone="secondary" variant="caption">
        {label}
      </Text>
    </View>
  );
}
