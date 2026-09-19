import { View } from 'react-native';

import { useProfile } from '@/features/profile';
import {
  Card,
  Screen,
  SectionGap,
  SectionHeader,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/**
 * 勋章墙（设计文档 §4.6）。
 *
 * ⚠️ 勋章体系与解锁条件待运营确认（§10 待确认 11）。
 */
const BADGES = [
  { id: 'b1', emoji: '🌱', name: '初次脉诊', description: '完成第一次脉诊', unlocked: true },
  { id: 'b2', emoji: '📅', name: '连续 7 天', description: '连续打卡 7 天', unlocked: true },
  { id: 'b3', emoji: '📖', name: '知己知彼', description: '完善体质档案', unlocked: true },
  { id: 'b4', emoji: '🔥', name: '连续 30 天', description: '连续打卡 30 天', unlocked: false },
  { id: 'b5', emoji: '💯', name: '百日坚持', description: '连续打卡 100 天', unlocked: false },
  { id: 'b6', emoji: '🌿', name: '体质改善', description: '主体质趋于平和', unlocked: false },
];

export default function BadgesScreen() {
  const { colors } = useTheme();
  const { data: profile } = useProfile();

  const unlockedCount = BADGES.filter((badge) => badge.unlocked).length;

  return (
    <Screen>
      <Card padding={spacing.lg} style={{ backgroundColor: colors.accentSubtle }}>
        <Text variant="title-2">
          Lv.{profile?.level ?? 1} {profile?.levelName ?? '养息者'}
        </Text>
        <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
          已获得 {unlockedCount} / {BADGES.length} 枚勋章
        </Text>
      </Card>

      <SectionGap />

      <SectionHeader title="勋章墙" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {BADGES.map((badge) => (
          <Card
            key={badge.id}
            style={{
              width: '31%',
              alignItems: 'center',
              gap: spacing.xxs,
              // 未解锁降低不透明度，但仍展示条件（引导而非隐藏）
              opacity: badge.unlocked ? 1 : 0.45,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.full,
                backgroundColor: badge.unlocked ? colors.accentSubtle : colors.skeleton,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="title-2">{badge.emoji}</Text>
            </View>
            <Text style={{ textAlign: 'center' }} variant="caption">
              {badge.name}
            </Text>
            <Text style={{ textAlign: 'center' }} tone="tertiary" variant="micro">
              {badge.description}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
