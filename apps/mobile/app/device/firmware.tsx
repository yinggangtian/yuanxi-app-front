import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useBoundDevice, useFirmwareUpdate } from '@/features/device';
import { useBleService } from '@/features/measurement';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  SectionGap,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/**
 * 固件升级（设计文档 §4.6）。
 *
 * ⚠️ DFU 协议待硬件确认（§10 待确认 8：芯片平台与 DFU 协议）。
 * 此处通过 BleService.startOta 抽象，底层实现替换时本页无需改动。
 *
 * 升级过程中禁止退出 —— 中断可能导致设备变砖。
 */
export default function FirmwareScreen() {
  const { colors } = useTheme();
  const { data: device } = useBoundDevice();
  const hasUpdate = useFirmwareUpdate();
  const service = useBleService();

  const [progress, setProgress] = useState<number | null>(null);
  const upgrading = progress !== null && progress < 100;
  const done = progress === 100;

  if (!device) {
    return (
      <Screen scroll={false}>
        <EmptyState description="请先绑定设备。" title="没有可升级的设备" />
      </Screen>
    );
  }

  if (!hasUpdate && !done) {
    return (
      <Screen scroll={false}>
        <EmptyState
          description={`当前固件 ${device.firmware} 已是最新版本。`}
          title="已是最新版本"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card padding={spacing.lg}>
        <Text variant="title-2">
          {done ? '升级完成' : `发现新版本 ${device.latestFirmware}`}
        </Text>
        <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
          当前版本 {device.firmware}
        </Text>

        <SectionGap size={spacing.md} />

        {progress !== null ? (
          <View style={{ gap: spacing.xs }}>
            <View
              style={{
                height: 8,
                borderRadius: radius.full,
                backgroundColor: colors.skeleton,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: radius.full,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <Text accessibilityLiveRegion="polite" tone="secondary" variant="caption">
              {done ? '设备正在重启，请稍候…' : `正在升级 ${progress}%，请勿关闭页面或断开设备`}
            </Text>
          </View>
        ) : (
          <Text tone="secondary" variant="body-sm">
            本次更新优化了脉搏信号采集稳定性，并修复了低电量下连接偶发中断的问题。
            {'\n\n'}
            升级前请确保设备电量高于 30%，并保持设备靠近手机。
          </Text>
        )}
      </Card>

      {done ? (
        <Button
          fullWidth
          label="完成"
          onPress={() => router.back()}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      ) : (
        <Button
          disabled={upgrading}
          fullWidth
          label={upgrading ? '升级中…' : '开始升级'}
          loading={upgrading}
          onPress={() => {
            setProgress(0);
            void service.startOta(
              {
                version: device.latestFirmware ?? device.firmware,
                uri: '',
                sizeBytes: 0,
              },
              setProgress,
            );
          }}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      )}

      {upgrading ? (
        <Text style={{ marginTop: spacing.xs, textAlign: 'center' }} tone="warning" variant="caption">
          升级过程中请勿退出，中断可能导致设备无法使用
        </Text>
      ) : null}
    </Screen>
  );
}
