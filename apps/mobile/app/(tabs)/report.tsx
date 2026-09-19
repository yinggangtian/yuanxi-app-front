import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReportList } from '@/features/report';
import { formatDateTime, formatRelativeDay } from '@/lib/format';
import {
  Card,
  EmptyState,
  Pressable,
  ScoreRing,
  Screen,
  SectionGap,
  SectionHeader,
  Skeleton,
  Text,
  spacing,
} from '@/ui';

import { TAB_BAR_HEIGHT } from './_layout';

/** 报告 Tab（设计文档 §4.3.1）。 */
export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { data: reports, isLoading } = useReportList();

  const [latest, ...history] = reports ?? [];

  /** 历史报告按月分组（§4.3.1）。 */
  const grouped = groupByMonth(history);

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT} contentStyle={{ paddingTop: insets.top + spacing.md }}>
      <Text variant="title-1">报告</Text>

      <SectionGap size={spacing.md} />

      {isLoading ? (
        <Card variant="raised">
          <Skeleton height={120} />
        </Card>
      ) : !latest ? (
        <EmptyState
          actionLabel="开始脉诊"
          description="完成一次脉诊后，报告会出现在这里。"
          onAction={() => router.push('/pulse')}
          title="还没有健康报告"
        />
      ) : (
        <>
          {/* 最新报告摘要卡 */}
          <Pressable
            accessibilityLabel={`最新报告，${latest.score} 分`}
            onPress={() => router.push(`/report/${latest.id}`)}
          >
            <Card padding={spacing.lg} variant="raised">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <ScoreRing
                  level={latest.scoreLevel}
                  score={latest.score}
                  scoreVariant="metric-lg"
                  size={104}
                  strokeWidth={8}
                />
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text tone="secondary" variant="caption">
                    {formatDateTime(latest.measuredAt)}
                  </Text>
                  <Text variant="title-3">{latest.pulsePattern}</Text>
                  <Text tone="secondary" variant="body-sm">
                    主体质：{latest.primaryConstitutionLabel}
                  </Text>
                  {latest.deltaFromPrevious !== null ? (
                    <Text
                      tone={latest.deltaFromPrevious >= 0 ? 'success' : 'warning'}
                      variant="caption"
                    >
                      较上次 {latest.deltaFromPrevious >= 0 ? '+' : ''}
                      {latest.deltaFromPrevious}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </Pressable>

          <SectionGap />

          <SectionHeader
            actionLabel="查看趋势"
            onAction={() => router.push('/report/trend')}
            title="评分趋势"
          />

          <SectionGap size={spacing.xs} />

          {/* 历史报告按月分组 */}
          {grouped.map((group) => (
            <View key={group.month} style={{ marginBottom: spacing.lg }}>
              <Text style={{ marginBottom: spacing.xs }} tone="secondary" variant="caption">
                {group.month}
              </Text>
              <Card padding={0}>
                {group.items.map((report, index) => (
                  <Pressable
                    accessibilityLabel={`${formatRelativeDay(report.measuredAt)} 报告，${report.score} 分`}
                    key={report.id}
                    onPress={() => router.push(`/report/${report.id}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: 'rgba(0,0,0,0.06)',
                      minHeight: 56,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="body">{report.pulsePattern}</Text>
                      <Text tone="secondary" variant="caption">
                        {formatDateTime(report.measuredAt)} · {report.primaryConstitutionLabel}
                      </Text>
                    </View>
                    <Text variant="metric">{report.score}</Text>
                  </Pressable>
                ))}
              </Card>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function groupByMonth<T extends { measuredAt: string }>(items: T[]): { month: string; items: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const date = new Date(item.measuredAt);
    const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()].map(([month, entries]) => ({ month, items: entries }));
}
