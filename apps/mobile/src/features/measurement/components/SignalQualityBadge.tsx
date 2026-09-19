import { SignalHigh, SignalLow, SignalMedium } from 'lucide-react-native';
import { View } from 'react-native';

import { Text, radius, semanticColors, spacing } from '../../../ui';
import type { QualityAssessment } from '../engine/SignalQuality';

/**
 * 信号质量徽章（设计文档 §4.2.2 / §7.4）。
 *
 * **颜色 + 图标 + 文字**三重表达 —— 不允许只靠颜色传达状态（§1.3 原则 2）。
 */
export function SignalQualityBadge({ quality }: { quality: QualityAssessment | null }) {
  const colors = semanticColors.dark;

  const grade = quality?.grade ?? 'poor';
  const icon = { good: SignalHigh, fair: SignalMedium, poor: SignalLow }[grade];
  const color = { good: colors.accent, fair: colors.warning, poor: colors.danger }[grade];
  const label = { good: '信号优', fair: '信号良', poor: '信号差' }[grade];
  const Component = icon;

  return (
    <View
      accessibilityLabel={`${label}，${quality?.score ?? 0} 分`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.xs,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Component color={color} size={16} strokeWidth={2} />
      <Text style={{ color: '#FFFFFF' }} variant="caption">
        {label}
      </Text>
    </View>
  );
}
