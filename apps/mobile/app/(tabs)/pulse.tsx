import { router } from 'expo-router';
import { Check, CircleAlert, LoaderCircle } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBoundDevice } from '@/features/device';
import { usePreflight, type PreflightCheck } from '@/features/measurement';
import { useLatestReport } from '@/features/report';
import { formatRelativeDay } from '@/lib/format';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  Icon,
  Pressable,
  Screen,
  SectionGap,
  Text,
  duration,
  easingBreath,
  radius,
  spacing,
  useReducedMotion,
  useTheme,
} from '@/ui';

import { TAB_BAR_HEIGHT } from './_layout';

/** 脉诊准备态（设计文档 §4.2.1 / §7.3）。 */
export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const { data: device } = useBoundDevice();
  const { data: latest } = useLatestReport();
  const { checks, canStart } = usePreflight(device?.bleId ?? null);

  if (!device) {
    return (
      <Screen bottomInset={TAB_BAR_HEIGHT} scroll={false}>
        <EmptyState
          actionLabel="去绑定设备"
          description="连接脉搏环后即可开始脉诊。"
          onAction={() => router.push('/device/scan')}
          title="还没有绑定设备"
        />
      </Screen>
    );
  }

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT} contentStyle={{ paddingTop: insets.top + spacing.md }}>
      <Text variant="title-1">脉诊</Text>

      <SectionGap size={spacing.lg} />

      {/* 设备主视觉 + 呼吸光晕（§7.3） */}
      <DeviceHero />

      <SectionGap size={spacing.lg} />

      <Text style={{ marginBottom: spacing.xs }} variant="title-3">
        测量前检查
      </Text>
      <Card>
        {checks.map((check, index) => (
          <View key={check.key}>
            {index > 0 ? <Divider /> : null}
            <PreflightRow check={check} />
          </View>
        ))}
      </Card>

      <Text style={{ marginTop: spacing.md }} tone="secondary" variant="body-sm">
        请保持静坐，手腕放松，测量约 60 秒。测量过程中请勿说话或移动手臂。
      </Text>

      <Button
        disabled={!canStart}
        fullWidth
        glow
        label="开始测量"
        onPress={() => router.push('/measure/live')}
        size="lg"
        style={{ marginTop: spacing.md }}
        testID="pulse-start"
      />

      {latest ? (
        <Text style={{ marginTop: spacing.xs, textAlign: 'center' }} tone="tertiary" variant="caption">
          上次测量：{formatRelativeDay(latest.measuredAt)} · {latest.score} 分
        </Text>
      ) : null}
    </Screen>
  );
}

/** 预检清单单行（§7.3）：图标 + 文字双重表达状态。 */
function PreflightRow({ check }: { check: PreflightCheck }) {
  const { colors } = useTheme();

  const icon =
    check.status === 'passed' ? Check : check.status === 'failed' ? CircleAlert : LoaderCircle;
  const tone =
    check.status === 'passed' ? 'success' : check.status === 'failed' ? 'warning' : 'tertiary';

  return (
    <View style={{ paddingVertical: spacing.sm, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon icon={icon} size={18} tone={tone} />
        <Text style={{ flex: 1 }} variant="body">
          {check.label}
        </Text>
        <Text tone="secondary" variant="body-sm">
          {check.detail}
        </Text>
      </View>

      {check.hint ? (
        <View style={{ paddingLeft: 26, gap: spacing.xxs }}>
          <Text tone="warning" variant="caption">
            {check.hint}
          </Text>
          {check.key === 'fit' ? (
            <Pressable
              accessibilityLabel="查看佩戴教学"
              onPress={() => router.push('/device/wear-guide')}
            >
              <Text style={{ color: colors.accentText }} variant="caption">
                查看佩戴教学 →
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** 设备主视觉：呼吸浮动 ±6pt，4s 周期（§5.9 / §6.7 motion-breath）。 */
function DeviceHero() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      float.value = 0;
      return;
    }
    float.value = withRepeat(
      withTiming(1, { duration: duration.breath, easing: easingBreath }),
      -1,
      true,
    );
  }, [reducedMotion, float]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 + float.value * 12 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + float.value * 0.14,
    transform: [{ scaleX: 1 - float.value * 0.12 }],
  }));

  return (
    <View style={{ alignItems: 'center', height: 168, justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 132,
            height: 132,
            borderRadius: radius.full,
            borderWidth: 12,
            borderColor: colors.accentSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          },
          heroStyle,
        ]}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: radius.full,
            borderWidth: 3,
            borderColor: colors.accent,
          }}
        />
      </Animated.View>

      {/* 底部柔光投影，随浮动缩放（§5.9 V1 方案） */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 8,
            width: 96,
            height: 10,
            borderRadius: radius.full,
            backgroundColor: colors.accent,
          },
          glowStyle,
        ]}
      />
    </View>
  );
}
