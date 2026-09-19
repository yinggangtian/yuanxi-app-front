import { router } from 'expo-router';
import { Battery, BatteryLow, ChevronRight, Circle } from 'lucide-react-native';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBoundDevice } from '@/features/device';
import { solarTermLabel, useProfile } from '@/features/profile';
import { useLatestReport, useMeasuredToday, useRecentScores } from '@/features/report';
import { greeting } from '@/lib/format';
import {
  Button,
  Card,
  Icon,
  PAGE_PADDING,
  Pressable,
  ScoreRing,
  Screen,
  SectionGap,
  SectionHeader,
  Skeleton,
  Sparkline,
  Text,
  spacing,
  useTheme,
} from '@/ui';

import { TAB_BAR_HEIGHT } from './_layout';

/** 首页（设计文档 §4.1 / §7.2）。 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const { data: device } = useBoundDevice();
  const { data: latest, isLoading } = useLatestReport();
  const measuredToday = useMeasuredToday();
  const recentScores = useRecentScores();

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT} contentStyle={{ paddingTop: insets.top + spacing.md }}>
      {/* 问候与节气 */}
      <Text variant="title-1">
        {greeting()}，{profile?.nickname ?? '朋友'}
      </Text>
      <Text style={{ marginTop: 2 }} tone="secondary" variant="caption">
        {new Date().getMonth() + 1}月{new Date().getDate()}日 · {solarTermLabel()}
      </Text>

      <SectionGap size={spacing.md} />

      {/* 设备状态胶囊 */}
      <DeviceStatusPill />

      <SectionGap size={spacing.md} />

      {/* 今日脉诊主卡 */}
      {isLoading ? (
        <Card variant="raised">
          <Skeleton height={140} />
        </Card>
      ) : !device ? (
        <NoDeviceCard />
      ) : measuredToday && latest ? (
        <TodayResultCard
          delta={latest.deltaFromPrevious}
          level={latest.scoreLevel}
          onPress={() => router.push(`/report/${latest.id}`)}
          pattern={`${latest.pulsePattern} · ${latest.primaryConstitutionLabel}倾向`}
          score={latest.score}
        />
      ) : (
        <StartMeasureCard />
      )}

      <SectionGap />

      {/* 近 7 次趋势 */}
      <SectionHeader actionLabel="全部" onAction={() => router.push('/report/trend')} title="近 7 次趋势" />
      <TrendMiniCard scores={recentScores} />

      <SectionGap />

      {/* 今日调理 */}
      <SectionHeader title="今日调理" />
      <AdviceRow />
    </Screen>
  );
}

/** 设备状态胶囊（§7.2）：已连接 / 未连接 / 低电量，点击进入设备管理。 */
function DeviceStatusPill() {
  const { colors } = useTheme();
  const { data: device } = useBoundDevice();

  if (!device) return null;

  // 演示数据：默认展示已连接 + 82% 电量
  const battery = 82;
  const lowBattery = battery < 20;

  return (
    <Pressable
      accessibilityLabel={`${device.name} 已连接，电量 ${battery}%`}
      onPress={() => router.push('/device/manage')}
    >
      <Card padding={spacing.sm} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {/* 颜色之外再用图标与文字表达状态（§1.3 原则 2） */}
        <Circle color={colors.success} fill={colors.success} size={8} />
        <Text style={{ flex: 1 }} variant="body-sm">
          {device.name} 已连接
        </Text>
        <Icon
          icon={lowBattery ? BatteryLow : Battery}
          size={18}
          tone={lowBattery ? 'danger' : 'secondary'}
        />
        <Text tone={lowBattery ? 'danger' : 'secondary'} variant="body-sm">
          {battery}%
        </Text>
        <ChevronRight color={colors.textTertiary} size={16} strokeWidth={1.5} />
      </Card>
    </Pressable>
  );
}

/** 已测态主卡（§7.2）。 */
function TodayResultCard({
  score,
  level,
  pattern,
  delta,
  onPress,
}: {
  score: number;
  level: string;
  pattern: string;
  delta: number | null;
  onPress: () => void;
}) {
  return (
    <Card padding={spacing.lg} variant="raised">
      <Text variant="title-3">今日脉诊</Text>

      <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
        <ScoreRing level={level} score={score} scoreVariant="display" size={168} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text tone="secondary" variant="body-sm">
          {pattern}
        </Text>
        {delta !== null ? (
          <Text tone={delta >= 0 ? 'success' : 'warning'} variant="body-sm">
            较上次 {delta >= 0 ? '+' : ''}
            {delta}
          </Text>
        ) : null}
      </View>

      <Button
        fullWidth
        label="查看完整报告"
        onPress={onPress}
        size="lg"
        style={{ marginTop: spacing.sm }}
        variant="secondary"
      />
    </Card>
  );
}

/** 未测态主卡（§7.2）：呼吸光晕 + 「开始今日脉诊」。 */
function StartMeasureCard() {
  return (
    <Card padding={spacing.lg} variant="raised">
      <Text variant="title-3">今日脉诊</Text>
      <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
        今天还没有测量。保持静坐、手腕放松，约 60 秒即可完成。
      </Text>
      <Button
        fullWidth
        glow
        label="开始今日脉诊"
        onPress={() => router.push('/pulse')}
        size="lg"
        style={{ marginTop: spacing.md }}
        testID="home-start-measure"
      />
    </Card>
  );
}

/** 无设备态（§4.1）。 */
function NoDeviceCard() {
  return (
    <Card padding={spacing.lg} variant="raised">
      <Text variant="title-3">绑定你的脉搏环</Text>
      <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
        连接设备后即可开始脉诊，查看每日脉象与体质变化。
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md }}>
        <Button
          label="去绑定"
          onPress={() => router.push('/device/scan')}
          size="lg"
          style={{ flex: 1 }}
        />
        <Button
          label="去商城了解"
          onPress={() => router.push('/mall')}
          size="lg"
          style={{ flex: 1 }}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

function TrendMiniCard({ scores }: { scores: number[] }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - PAGE_PADDING * 2 - spacing.md * 2 - 48;
  const last = scores[scores.length - 1];

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Sparkline accessibilityLabel={`近 ${scores.length} 次评分趋势`} values={scores} width={chartWidth} />
      <Text variant="metric">{last}</Text>
    </Card>
  );
}

/** 今日调理建议横滑卡（§7.2）。 */
function AdviceRow() {
  const items = [
    { emoji: '🍵', category: '饮食', text: '少食生冷，可饮玫瑰花茶疏肝理气' },
    { emoji: '🧘', category: '作息', text: '23 点前入睡，睡前温水泡脚 15 分钟' },
    { emoji: '📍', category: '穴位', text: '按揉太冲穴 3 分钟，以酸胀为度' },
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <Card key={item.category} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Text variant="title-3">{item.emoji}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title-3">{item.category}</Text>
            <Text tone="secondary" variant="body-sm">
              {item.text}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}
