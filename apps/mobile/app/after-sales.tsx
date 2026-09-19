import { router } from 'expo-router';
import { FileText, Headset, PackageOpen, RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';

import {
  Card,
  Divider,
  ListItem,
  Screen,
  SectionGap,
  SectionHeader,
  Text,
  spacing,
} from '@/ui';

/** 发票与售后（设计文档 §4.6）。 */
export default function AfterSalesScreen() {
  return (
    <Screen>
      <SectionHeader title="售后服务" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={RotateCcw}
            onPress={() => router.push('/orders')}
            showChevron
            subtitle="签收后 7 天内可申请"
            title="申请退换货"
          />
          <Divider />
          <ListItem
            icon={PackageOpen}
            onPress={() => router.push('/orders')}
            showChevron
            subtitle="查看已提交的售后申请进度"
            title="售后进度"
          />
        </View>
      </Card>

      <SectionGap />

      <SectionHeader title="发票" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={FileText}
            onPress={() => router.push('/orders')}
            showChevron
            subtitle="支持电子普通发票，开具后发送至邮箱"
            title="申请开票"
          />
          <Divider />
          <ListItem icon={FileText} onPress={() => undefined} showChevron title="发票抬头管理" />
        </View>
      </Card>

      <SectionGap />

      <SectionHeader title="帮助" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={Headset}
            onPress={() => undefined}
            showChevron
            subtitle="工作日 9:00–18:00"
            title="联系在线客服"
          />
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      <Text tone="tertiary" variant="caption">
        脉搏环整机保修 12 个月，人为损坏不在保修范围内。
        贴身佩戴类配件（表带等）因卫生原因不支持无理由退货。
      </Text>
    </Screen>
  );
}
