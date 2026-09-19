import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { describeQuality } from '@/features/measurement';
import {
  Button,
  Card,
  Icon,
  Pressable,
  Screen,
  SectionGap,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

interface WearStep {
  title: string;
  description: string;
  correct: string;
  wrong: string;
}

/**
 * 佩戴三步（设计文档 §4.4.3）。
 *
 * ⚠️ 佩戴方向与「腕骨」具体指代待硬件/设计确认（§10 待确认 9）：
 * 传感器朝向手腕内侧还是外侧、腕骨指尺骨茎突还是桡骨茎突。
 * 文案集中在此，确认后只改这一处。
 */
const STEPS: WearStep[] = [
  {
    title: '佩戴在腕骨上方两指处',
    description: '将食指与中指并拢放在腕骨上方，脉搏环佩戴在两指的上沿位置。',
    correct: '正确：腕骨上方两指',
    wrong: '错误：离腕骨太近',
  },
  {
    title: '松紧适中',
    description: '佩戴后可以轻松插入一根手指，取下时手腕不应留下压痕。',
    correct: '正确：可插入一指',
    wrong: '错误：勒出红痕',
  },
  {
    title: '传感器贴合皮肤',
    description: '传感器一面需紧贴皮肤、朝向手腕内侧，佩戴后轻轻转动确认无缝隙。',
    correct: '正确：紧贴皮肤',
    wrong: '错误：有缝隙',
  },
];

/** 正确佩戴教学（设计文档 §4.4.3 / §7.8）。 */
export default function WearGuideScreen() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);

  const step = STEPS[index] as WearStep;
  const isLast = index === STEPS.length - 1;

  // 最后一步做贴合度实时检测（§4.4.3）
  const [fitChecked, setFitChecked] = useState(false);
  const fitQuality = describeQuality(fitChecked ? 88 : 0);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Text tone="secondary" variant="body-sm">
          {index + 1} / {STEPS.length}
        </Text>
      </View>

      <SectionGap size={spacing.sm} />

      {/* 插画区（§7.8）：以线性示意图占位，待设计产出后替换 */}
      <Card padding={0} style={{ height: 240, alignItems: 'center', justifyContent: 'center' }}>
        <WristIllustration step={index} />
      </Card>

      <SectionGap size={spacing.lg} />

      <Text variant="title-1">{step.title}</Text>
      <Text style={{ marginTop: spacing.xs }} tone="secondary" variant="body">
        {step.description}
      </Text>

      <SectionGap size={spacing.md} />

      {/* 正误对比（§7.8） */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <ComparisonCard correct label={step.correct} />
        <ComparisonCard correct={false} label={step.wrong} />
      </View>

      <SectionGap size={spacing.lg} />

      {/* 最后一步：贴合度实时检测 */}
      {isLast ? (
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: radius.full,
                backgroundColor: fitChecked ? colors.success : colors.textTertiary,
              }}
            />
            <Text style={{ flex: 1 }} variant="body-sm">
              {fitChecked ? `贴合良好 · ${fitQuality.score} 分` : '贴合度检测中…'}
            </Text>
            {!fitChecked ? (
              <Pressable accessibilityLabel="模拟检测完成" onPress={() => setFitChecked(true)}>
                <Text style={{ color: colors.accentText }} variant="caption">
                  我已戴好
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ) : null}

      {/* 分页指示 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.xs,
          marginBottom: spacing.md,
        }}
      >
        {STEPS.map((_, dotIndex) => (
          <View
            key={dotIndex}
            style={{
              width: dotIndex === index ? 16 : 6,
              height: 6,
              borderRadius: radius.full,
              backgroundColor: dotIndex === index ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>

      <Button
        // 达到「良」以上才点亮「完成」（§4.4.3）
        disabled={isLast && !fitChecked}
        fullWidth
        label={isLast ? '完成' : '下一步'}
        onPress={() => {
          if (isLast) router.replace('/pulse');
          else setIndex((current) => current + 1);
        }}
        size="lg"
        testID="wear-guide-next"
      />

      {index > 0 ? (
        <Pressable
          accessibilityLabel="上一步"
          onPress={() => setIndex((current) => current - 1)}
          style={{ alignItems: 'center', paddingVertical: spacing.sm }}
        >
          <Text tone="secondary" variant="body-sm">
            上一步
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function ComparisonCard({ correct, label }: { correct: boolean; label: string }) {
  const { colors } = useTheme();
  const color = correct ? colors.success : colors.danger;

  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}0F`,
        padding: spacing.sm,
        gap: spacing.xxs,
      }}
    >
      <Icon icon={correct ? Check : X} size={16} tone={correct ? 'success' : 'danger'} />
      <Text style={{ color }} variant="caption">
        {label}
      </Text>
    </View>
  );
}

/** 手腕佩戴位置示意（线性示意，待设计插画替换）。 */
function WristIllustration({ step }: { step: number }) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }}>
      {/* 手腕 */}
      <View
        style={{
          width: 120,
          height: 150,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 脉搏环位置高亮 */}
        <View
          style={{
            position: 'absolute',
            top: step === 0 ? 48 : 56,
            width: 128,
            height: 20,
            borderRadius: radius.sm,
            backgroundColor: colors.accent,
            opacity: 0.9,
          }}
        />
        {/* 腕骨标记 */}
        <View
          style={{
            position: 'absolute',
            top: 100,
            width: 14,
            height: 14,
            borderRadius: radius.full,
            borderWidth: 1.5,
            borderColor: colors.textTertiary,
          }}
        />
      </View>

      <Text tone="tertiary" variant="caption">
        {step === 0 ? '○ 腕骨 · 上方两指处佩戴' : step === 1 ? '可插入一指的松紧' : '传感器面朝手腕内侧'}
      </Text>
    </View>
  );
}
