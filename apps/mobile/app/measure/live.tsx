import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SignalQualityBadge,
  StageProgressRing,
  useMeasurementSession,
  useMeasurementStore,
} from '@/features/measurement';
import { mockReportSummaries } from '@/mocks';
import {
  Dialog,
  GlassCard,
  PAGE_PADDING,
  Pressable,
  Text,
  WaveformCanvas,
  palette,
  radius,
  spacing,
} from '@/ui';

/**
 * 测量中 —— 全屏模态（设计文档 §4.2.2 / §7.4）。
 *
 * 背景为 #0E1A22 → #0A3A37 深色渐变，突出波形；
 * 屏幕常亮、禁用返回手势，退出需二次确认。
 */
export default function MeasureLiveScreen() {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [exitVisible, setExitVisible] = useState(false);

  const quality = useMeasurementStore((state) => state.quality);
  const bpm = useMeasurementStore((state) => state.bpm);
  const phase = useMeasurementStore((state) => state.phase);
  const stageLabel = useMeasurementStore((state) => state.stageLabel);
  const stageIndex = useMeasurementStore((state) => state.stageIndex);
  const stageCount = useMeasurementStore((state) => state.stageCount);
  const totalProgress = useMeasurementStore((state) => state.totalProgress);
  const remainingSec = useMeasurementStore((state) => state.remainingSec);
  const showWearHint = useMeasurementStore((state) => state.showWearHint);
  const reset = useMeasurementStore((state) => state.reset);
  const succeed = useMeasurementStore((state) => state.succeed);

  const handleCompleted = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 演示：分析完成后跳最新报告；接真实接口时改为上传原始数据并等待报告 id
    const reportId = mockReportSummaries[0]?.id ?? 'rpt_0007';
    setTimeout(() => {
      succeed(reportId);
      router.replace(`/report/${reportId}`);
    }, 2200);
  }, [succeed]);

  const { waveform } = useMeasurementSession({ enabled: true, onCompleted: handleCompleted });

  /** 阶段切换轻触感（§4.2.2）。 */
  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [stageIndex]);

  useEffect(() => () => reset(), [reset]);

  const degraded = quality?.grade === 'poor';
  const analyzing = phase === 'analyzing';

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0E1A22', '#0A3A37']} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + spacing.xs,
            paddingBottom: insets.bottom + spacing.lg,
            paddingHorizontal: PAGE_PADDING,
          }}
        >
          {/* 顶部：退出 + 信号质量 */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              accessibilityLabel="退出测量"
              onPress={() => setExitVisible(true)}
              style={{ padding: spacing.xxs }}
              testID="measure-exit"
            >
              <X color="#FFFFFF" size={24} strokeWidth={1.5} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <SignalQualityBadge quality={quality} />
          </View>

          {analyzing ? (
            <AnalyzingView />
          ) : (
            <>
              {/* 进度环 + 实时脉率 */}
              <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
                <StageProgressRing
                  bpm={bpm}
                  paused={degraded}
                  progress={totalProgress}
                  remainingSec={remainingSec}
                  stageCount={stageCount}
                  stageIndex={stageIndex}
                  stageLabel={stageLabel}
                />
              </View>

              {/* 阶段步进条 */}
              <StageStepper current={stageIndex} total={stageCount} />

              {/* 实时波形 */}
              <View style={{ marginTop: spacing.xl }}>
                <WaveformCanvas
                  degraded={degraded}
                  height={180}
                  onDark
                  samples={waveform}
                  width={width - PAGE_PADDING * 2}
                />
              </View>

              <View style={{ flex: 1 }} />

              {/* 玻璃反馈卡 */}
              <FeedbackGlassCard
                degraded={degraded}
                message={
                  showWearHint
                    ? (quality?.message ?? '传感器接触不良，请调整佩戴')
                    : degraded
                      ? (quality?.message ?? '信号不稳定，请保持静止')
                      : '做得很好，请保持手腕放松'
                }
                showWearGuide={showWearHint}
              />
            </>
          )}
        </View>
      </LinearGradient>

      <Dialog
        confirmLabel="退出"
        destructive
        message="退出将丢弃本次测量，已采集的数据不会被保存。"
        onCancel={() => setExitVisible(false)}
        onConfirm={() => {
          setExitVisible(false);
          reset();
          router.back();
        }}
        title="确定要退出测量吗？"
        visible={exitVisible}
      />
    </View>
  );
}

/** 阶段步进条：校准 ─ 浮取 ─ ●中取 ─ 沉取 ─ 分析（§7.4）。 */
function StageStepper({ current, total }: { current: number; total: number }) {
  const labels = ['校准', '浮取', '中取', '沉取', '分析'].slice(0, total);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
      }}
    >
      {labels.map((label, index) => {
        const active = index + 1 === current;
        const done = index + 1 < current;
        return (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text
              style={{
                color: active
                  ? palette.primary[300]
                  : done
                    ? 'rgba(255,255,255,0.72)'
                    : 'rgba(255,255,255,0.4)',
              }}
              variant="caption"
            >
              {active ? `● ${label}` : label}
            </Text>
            {index < labels.length - 1 ? (
              <Text style={{ color: 'rgba(255,255,255,0.24)' }} variant="caption">
                ─
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** 磨砂玻璃反馈卡（§7.4）。信号差时左侧加 danger 竖条。 */
function FeedbackGlassCard({
  message,
  degraded,
  showWearGuide,
}: {
  message: string;
  degraded: boolean;
  showWearGuide: boolean;
}) {
  return (
    <GlassCard style={{ marginTop: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {degraded ? (
          <View
            style={{
              width: 3,
              borderRadius: radius.full,
              backgroundColor: '#F0685F',
            }}
          />
        ) : null}
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <Text accessibilityLiveRegion="polite" style={{ color: '#FFFFFF' }} variant="body-sm">
            {degraded ? '' : '🌿 '}
            {message}
          </Text>
          {showWearGuide ? (
            <Pressable
              accessibilityLabel="查看佩戴教学"
              onPress={() => router.push('/device/wear-guide')}
            >
              <Text style={{ color: palette.primary[300] }} variant="caption">
                查看佩戴教学 →
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

/** 分析中（§7.4）：呼吸光圈 + 分步文案。 */
function AnalyzingView() {
  const steps = ['解析脉象特征', '匹配体质模型', '生成调理建议'];
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((count) => Math.min(count + 1, steps.length));
    }, 700);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radius.full,
          borderWidth: 2,
          borderColor: palette.primary[300],
          opacity: 0.6,
          marginBottom: spacing.md,
        }}
      />
      <Text style={{ color: '#FFFFFF' }} variant="title-2">
        正在生成报告
      </Text>
      {steps.slice(0, visibleCount).map((step) => (
        <Text key={step} style={{ color: 'rgba(255,255,255,0.72)' }} variant="body-sm">
          {step}…
        </Text>
      ))}
    </View>
  );
}
