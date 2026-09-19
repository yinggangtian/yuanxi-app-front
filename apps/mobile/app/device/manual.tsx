import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Input, Screen, SectionGap, Text, spacing } from '@/ui';

/**
 * 手动添加设备（设计文档 §4.4.1）。
 *
 * 扫码需要 expo-camera 的运行时权限，在 Dev Client 中方可使用；
 * 此处同时提供 SN 手动输入作为兜底路径。
 */
export default function ManualAddScreen() {
  const [sn, setSn] = useState('');
  const trimmed = sn.trim().toUpperCase();
  // 演示规则：SN 为 12 位字母数字
  const valid = /^[A-Z0-9]{12}$/.test(trimmed);
  const showError = trimmed.length > 0 && !valid;

  return (
    <Screen>
      <Text variant="title-2">输入设备序列号</Text>
      <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
        序列号印在设备包装盒背面或机身内侧，共 12 位。
      </Text>

      <SectionGap size={spacing.lg} />

      <Card>
        <Input
          autoCapitalize="characters"
          autoCorrect={false}
          error={showError ? '序列号格式不正确，应为 12 位字母或数字' : undefined}
          label="设备序列号（SN）"
          maxLength={12}
          numeric
          onChangeText={setSn}
          placeholder="例如 YX2026A18F2A"
          value={sn}
        />
      </Card>

      <Button
        disabled={!valid}
        fullWidth
        label="添加设备"
        onPress={() => router.replace({ pathname: '/device/confirm', params: { deviceId: trimmed } })}
        size="lg"
        style={{ marginTop: spacing.lg }}
      />

      <SectionGap />

      <Card>
        <Text variant="title-3">或扫描包装二维码</Text>
        <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
          扫码功能需要相机权限。为遵守隐私合规要求，元息只在你主动发起扫码时
          调用相机，且不会保存任何图像。
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <Button
            fullWidth
            label="打开相机扫码"
            onPress={() => router.push('/device/scan')}
            size="md"
            variant="secondary"
          />
        </View>
      </Card>
    </Screen>
  );
}
