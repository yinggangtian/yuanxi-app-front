import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../../stores/appStore';
import { Button, Card, Checkbox, PAGE_PADDING, Text, spacing, useTheme } from '../../ui';

/**
 * 隐私协议门禁（设计文档 §8 合规）。
 *
 * 国内应用商店要求：**同意隐私政策前不得收集任何信息、不得初始化三方 SDK**。
 * 因此未同意时整个应用只渲染本页，不挂载任何业务路由、不发起任何网络请求。
 *
 * 健康数据（脉搏、体质）属于《个人信息保护法》中的敏感个人信息，
 * 需要**单独同意**，故与总协议分成两个勾选项。
 */
export function PrivacyConsentGate({ children }: { children: React.ReactNode }) {
  const privacyConsent = useAppStore((state) => state.privacyConsent);
  const acceptPrivacy = useAppStore((state) => state.acceptPrivacy);
  const acceptHealthData = useAppStore((state) => state.acceptHealthData);

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [agreeBase, setAgreeBase] = useState(false);
  const [agreeHealth, setAgreeHealth] = useState(false);

  if (privacyConsent) return <>{children}</>;

  const canContinue = agreeBase && agreeHealth;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + spacing['2xl'],
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: PAGE_PADDING,
      }}
      testID="privacy-consent-gate"
    >
      <Text variant="title-1">欢迎使用元息</Text>
      <Text style={{ marginTop: spacing.xs }} tone="secondary" variant="body-sm">
        在开始之前，请阅读并同意以下条款。同意前，我们不会收集你的任何信息，
        也不会启动任何第三方服务。
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: spacing.lg }}>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="title-3">我们会收集什么</Text>
          <Text tone="secondary" variant="body-sm">
            · 账号信息：手机号或第三方账号标识，用于登录与订单服务{'\n'}
            · 设备信息：脉搏环序列号、固件版本、电量，用于设备连接与维护{'\n'}
            · 健康数据：脉搏信号及由此生成的脉象与体质分析结果
          </Text>

          <Text style={{ marginTop: spacing.xs }} variant="title-3">
            你的权利
          </Text>
          <Text tone="secondary" variant="body-sm">
            你可以随时在「我的 → 设置」中导出或删除你的健康数据，也可以注销账号。
            注销后，我们将按法律法规要求删除或匿名化处理你的个人信息。
          </Text>

          <Text style={{ marginTop: spacing.xs }} variant="title-3">
            关于健康参考
          </Text>
          <Text tone="secondary" variant="body-sm">
            元息提供的脉象分析与调理建议仅供健康参考，不能替代医生诊断。
            如有不适，请及时就医。
          </Text>
        </Card>
      </ScrollView>

      <View style={{ gap: spacing.sm }}>
        <ConsentRow
          checked={agreeBase}
          label="我已阅读并同意《用户协议》与《隐私政策》"
          onChange={setAgreeBase}
        />
        <ConsentRow
          checked={agreeHealth}
          label="我同意元息处理我的健康数据（脉搏信号、脉象与体质分析结果），用于生成健康报告"
          onChange={setAgreeHealth}
        />

        <Button
          disabled={!canContinue}
          fullWidth
          label="同意并继续"
          onPress={() => {
            // 两项分别记录，便于后续单独撤回
            acceptHealthData();
            acceptPrivacy();
          }}
          size="lg"
          testID="privacy-accept"
        />
        <Text style={{ textAlign: 'center' }} tone="tertiary" variant="caption">
          不同意将无法使用元息的健康监测功能
        </Text>
      </View>
    </View>
  );
}

function ConsentRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}>
        <Checkbox accessibilityLabel={label} checked={checked} onChange={onChange} />
      </View>
      <Text style={{ flex: 1 }} tone="secondary" variant="body-sm">
        {label}
      </Text>
    </View>
  );
}
