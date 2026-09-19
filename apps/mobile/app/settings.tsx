import { router } from 'expo-router';
import {
  Bell,
  Download,
  FileText,
  Info,
  LogOut,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { useAppStore, useSessionStore } from '@/stores';
import {
  Card,
  Dialog,
  Divider,
  ListItem,
  Screen,
  SectionGap,
  SectionHeader,
  Text,
  spacing,
  useOptionalToast,
  useTheme,
} from '@/ui';

/** 设置（设计文档 §4.6 / §8）。 */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const toast = useOptionalToast();
  const signOut = useSessionStore((state) => state.signOut);
  const revokeConsent = useAppStore((state) => state.revokeConsent);

  const [measureReminder, setMeasureReminder] = useState(true);
  const [orderNotice, setOrderNotice] = useState(true);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  return (
    <Screen>
      <SectionHeader title="通知" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={Bell}
            right={
              <Switch
                accessibilityLabel="每日测量提醒"
                onValueChange={setMeasureReminder}
                thumbColor={colors.surface}
                trackColor={{ true: colors.accent, false: colors.border }}
                value={measureReminder}
              />
            }
            title="每日测量提醒"
          />
          <Divider />
          <ListItem
            icon={Bell}
            right={
              <Switch
                accessibilityLabel="订单与物流通知"
                onValueChange={setOrderNotice}
                thumbColor={colors.surface}
                trackColor={{ true: colors.accent, false: colors.border }}
                value={orderNotice}
              />
            }
            title="订单与物流通知"
          />
        </View>
      </Card>

      <SectionGap />

      {/* 隐私与数据权利（§8：提供数据导出与账号注销） */}
      <SectionHeader title="隐私与数据" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem
            icon={ShieldCheck}
            onPress={() => undefined}
            showChevron
            subtitle="查看我们如何收集与使用你的信息"
            title="隐私政策"
          />
          <Divider />
          <ListItem icon={FileText} onPress={() => undefined} showChevron title="用户协议" />
          <Divider />
          <ListItem
            icon={Download}
            onPress={() => toast.show('导出申请已提交，完成后将通知你')}
            showChevron
            subtitle="导出你的健康数据与订单记录"
            title="导出我的数据"
          />
          <Divider />
          <ListItem
            icon={Trash2}
            iconTone="danger"
            onPress={() => setDeleteVisible(true)}
            showChevron
            subtitle="将删除你的账号与全部健康数据"
            title="注销账号"
          />
        </View>
      </Card>

      <SectionGap />

      <SectionHeader title="关于" />
      <Card padding={0}>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ListItem icon={Info} title="版本" value="0.1.0" />
          <Divider />
          <ListItem
            icon={LogOut}
            iconTone="danger"
            onPress={() => setSignOutVisible(true)}
            title="退出登录"
          />
        </View>
      </Card>

      <SectionGap size={spacing.md} />

      <Text style={{ textAlign: 'center' }} tone="tertiary" variant="caption">
        元息提供的健康分析仅供参考，不能替代医生诊断。
      </Text>

      <Dialog
        confirmLabel="退出"
        destructive
        message="退出后需要重新登录才能查看报告与订单。"
        onCancel={() => setSignOutVisible(false)}
        onConfirm={() => {
          setSignOutVisible(false);
          void signOut();
          router.replace('/');
        }}
        title="确定要退出登录吗？"
        visible={signOutVisible}
      />

      <Dialog
        confirmLabel="确认注销"
        destructive
        message="注销后，你的账号、健康报告与体质档案将被删除或匿名化处理，且无法恢复。已完成的订单记录将依法保留。"
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => {
          setDeleteVisible(false);
          // 撤回同意并清空本地状态（§8：注销后删除或匿名化个人信息）
          revokeConsent();
          void signOut();
          router.replace('/');
        }}
        title="确定要注销账号吗？"
        visible={deleteVisible}
      />
    </Screen>
  );
}
