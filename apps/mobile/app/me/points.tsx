import { View } from 'react-native';

import { useProfile } from '@/features/profile';
import { formatRelativeDay } from '@/lib/format';
import {
  Card,
  Divider,
  Screen,
  SectionGap,
  SectionHeader,
  Skeleton,
  Text,
  spacing,
  useTheme,
} from '@/ui';

/**
 * 健康积分（设计文档 §4.6）。
 *
 * ⚠️ 积分规则与等级阈值待运营确认（§10 待确认 11）；
 * 下方记录为演示数据，接入后由 `/me/points` 接口下发。
 */
const MOCK_RECORDS = [
  { id: 'pt_1', title: '完成每日脉诊', delta: 20, at: 0 },
  { id: 'pt_2', title: '连续打卡 7 天', delta: 50, at: 1 },
  { id: 'pt_3', title: '下单赠送', delta: 200, at: 2 },
  { id: 'pt_4', title: '积分抵扣（订单 ...0002）', delta: -50, at: 9 },
  { id: 'pt_5', title: '完善体质档案', delta: 30, at: 30 },
];

export default function PointsScreen() {
  const { colors } = useTheme();
  const { data: profile, isLoading } = useProfile();

  const daysAgoIso = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  return (
    <Screen>
      {isLoading || !profile ? (
        <Skeleton height={120} />
      ) : (
        <Card padding={spacing.lg} style={{ backgroundColor: colors.accentSubtle }}>
          <Text tone="secondary" variant="body-sm">
            当前积分
          </Text>
          <Text style={{ marginTop: spacing.xxs }} tone="accent" variant="display">
            {profile.points}
          </Text>
          <Text style={{ marginTop: spacing.xs }} tone="secondary" variant="caption">
            积分可在结算时抵扣，100 积分 = 1 元
          </Text>
        </Card>
      )}

      <SectionGap />

      <SectionHeader title="积分记录" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          {MOCK_RECORDS.map((record, index) => (
            <View key={record.id}>
              {index > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  minHeight: 56,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body-sm">{record.title}</Text>
                  <Text tone="tertiary" variant="caption">
                    {formatRelativeDay(daysAgoIso(record.at))}
                  </Text>
                </View>
                <Text tone={record.delta >= 0 ? 'accent' : 'secondary'} variant="title-3">
                  {record.delta >= 0 ? '+' : ''}
                  {record.delta}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      <Text tone="tertiary" variant="caption">
        积分有效期为获得之日起 12 个月。具体规则以最新的《积分规则》为准。
      </Text>
    </Screen>
  );
}
