import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import {
  ADVICE_CATEGORY_LABEL,
  METRIC_STATUS_LABEL,
  REPORT_DISCLAIMER,
  type AdviceCategory,
  type MetricStatus,
} from '@/api/schemas';
import { useReportDetail, useTrend } from '@/features/report';
import { formatDateTime } from '@/lib/format';
import {
  Card,
  Chip,
  ConstitutionBars,
  Divider,
  ErrorState,
  PAGE_PADDING,
  PulseRadar,
  ScoreRing,
  Screen,
  SectionGap,
  SectionHeader,
  SegmentedTabs,
  Skeleton,
  SkeletonLines,
  Text,
  TrendChart,
  spacing,
  useTheme,
} from '@/ui';

/** 健康报告详情（设计文档 §4.3.2 / §7.5）。 */
export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isLoading, isError, refetch } = useReportDetail(id);
  const { width } = useWindowDimensions();
  const [adviceCategory, setAdviceCategory] = useState<AdviceCategory>('diet');
  const { data: trend } = useTrend('30d');

  if (isLoading) {
    return (
      <Screen>
        <Card variant="raised">
          <Skeleton height={180} />
        </Card>
        <SectionGap />
        <SkeletonLines lines={6} />
      </Screen>
    );
  }

  if (isError || !report) {
    return (
      <Screen scroll={false}>
        <ErrorState
          description="报告加载失败，请稍后重试。"
          onAction={() => void refetch()}
          title="无法打开报告"
        />
      </Screen>
    );
  }

  const advices = report.advices.filter((advice) => advice.category === adviceCategory);
  const availableCategories = [...new Set(report.advices.map((advice) => advice.category))];

  return (
    <Screen>
      <Text tone="secondary" variant="caption">
        {formatDateTime(report.measuredAt)}
      </Text>

      <SectionGap size={spacing.sm} />

      {/* 综合健康评分 */}
      <Card padding={spacing.lg} variant="raised">
        <View style={{ alignItems: 'center' }}>
          <ScoreRing level={report.scoreLevel} score={report.score} size={180} />
          {report.deltaFromPrevious !== null ? (
            <Text
              style={{ marginTop: spacing.xs }}
              tone={report.deltaFromPrevious >= 0 ? 'success' : 'warning'}
              variant="body-sm"
            >
              较上次 {report.deltaFromPrevious >= 0 ? '↑' : '↓'}
              {Math.abs(report.deltaFromPrevious)}
            </Text>
          ) : null}
        </View>

        <Divider />

        <View style={{ marginTop: spacing.sm, gap: spacing.xxs }}>
          <Text variant="title-3">脉象：{report.pulsePattern}</Text>
          <Text tone="secondary" variant="body-sm">
            {report.pulsePatternExplanation}
          </Text>
        </View>
      </Card>

      <SectionGap />

      {/* 体质归因 */}
      <SectionHeader title="体质归因" />
      <Card>
        <ConstitutionBars
          items={report.constitutions.map((item) => ({
            name: item.label,
            percent: Math.round(item.percent),
            primary: item.primary,
          }))}
        />

        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
          {report.constitutions
            .filter((item) => item.percent >= 35)
            .map((item) => (
              <Chip
                key={item.type}
                label={item.primary ? item.label : `兼 ${item.label}`}
                tone={item.primary ? 'accent' : 'neutral'}
              />
            ))}
        </View>

        {report.constitutions[0] ? (
          <Text style={{ marginTop: spacing.sm }} tone="secondary" variant="caption">
            {report.constitutions[0].description}
          </Text>
        ) : null}
      </Card>

      <SectionGap />

      {/* 多维脉象指标 */}
      <SectionHeader title="脉象指标" />
      <Card>
        <View style={{ alignItems: 'center' }}>
          <PulseRadar
            axes={report.metrics.map((metric) => ({
              label: metric.label,
              value: metric.normalized,
            }))}
            size={Math.min(width - PAGE_PADDING * 2 - spacing.md * 2, 260)}
          />
        </View>

        <Divider />

        <View style={{ marginTop: spacing.xs }}>
          {report.metrics.map((metric, index) => (
            <View key={metric.key}>
              {index > 0 ? <Divider /> : null}
              <MetricRow
                label={metric.label}
                reference={metric.referenceRange}
                status={metric.status}
                value={metric.displayValue}
              />
            </View>
          ))}
        </View>
      </Card>

      <SectionGap />

      {/* 中医调理建议 */}
      <SectionHeader title="调理建议" />
      <SegmentedTabs
        items={availableCategories.map((category) => ({
          key: category,
          label: ADVICE_CATEGORY_LABEL[category],
        }))}
        onChange={(key) => setAdviceCategory(key as AdviceCategory)}
        scrollable
        value={adviceCategory}
      />

      <SectionGap size={spacing.sm} />

      {advices.map((advice) => (
        <Card key={advice.id} style={{ marginBottom: spacing.sm }}>
          <Text variant="title-3">{advice.title}</Text>
          <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
            {advice.content}
          </Text>
        </Card>
      ))}

      <SectionGap />

      {/* 近期趋势 */}
      <SectionHeader title="近期趋势" />
      <Card>
        <TrendChart
          height={100}
          points={(trend ?? []).map((point) => ({ label: point.label, value: point.score }))}
          width={width - PAGE_PADDING * 2 - spacing.md * 2}
        />
      </Card>

      <SectionGap />

      {/* 免责声明 —— 固定在底部，文案集中管理（§4.3.2 / §8） */}
      <Text style={{ textAlign: 'center' }} tone="tertiary" variant="caption">
        {REPORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

/** 指标行（§7.5）：数值 + 参考区间 + 状态标签。状态必须有文字，不只用颜色。 */
function MetricRow({
  label,
  value,
  reference,
  status,
}: {
  label: string;
  value: string;
  reference: string | null;
  status: MetricStatus;
}) {
  const { colors } = useTheme();

  const statusColor = {
    normal: colors.success,
    attention: colors.warning,
    abnormal: colors.danger,
  }[status];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
      }}
    >
      <Text style={{ width: 56 }} variant="body-sm">
        {label}
      </Text>
      <Text style={{ flex: 1 }} variant="body-sm">
        {value}
      </Text>
      {reference ? (
        <Text style={{ width: 72, textAlign: 'right' }} tone="tertiary" variant="caption">
          {reference}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: 52, justifyContent: 'flex-end' }}>
        <Text style={{ color: statusColor }} variant="caption">
          {METRIC_STATUS_LABEL[status]}
        </Text>
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }}
        />
      </View>
    </View>
  );
}
