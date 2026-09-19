import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDeviceStore, type DeviceInfo } from '@/features/bluetooth';
import { BatteryIndicator, SignalBars } from '@/features/device';
import { useBleService } from '@/features/measurement';
import { maskSn } from '@/lib/format';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Icon,
  Pressable,
  Screen,
  SectionGap,
  Skeleton,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

type Step = 'connecting' | 'reading' | 'ready' | 'failed';

const STEP_LABEL: Record<Step, string> = {
  connecting: '正在连接设备…',
  reading: '正在读取设备信息…',
  ready: '已找到你的设备',
  failed: '连接失败',
};

/** 发现与确认设备（设计文档 §4.4.2 / §7.7）。 */
export default function DeviceConfirmScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const { colors } = useTheme();
  const service = useBleService();

  const discovered = useDeviceStore((state) => state.discovered);
  const rememberDevice = useDeviceStore((state) => state.rememberDevice);
  const setDeviceInfo = useDeviceStore((state) => state.setDeviceInfo);

  const [step, setStep] = useState<Step>('connecting');
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [binding, setBinding] = useState(false);

  const device = discovered.find((entry) => entry.id === deviceId);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    void (async () => {
      try {
        const result = await service.connect(deviceId);
        if (cancelled) return;
        setInfo(result);
        setDeviceInfo(result);
        setStep('ready');
      } catch {
        if (!cancelled) setStep('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deviceId, service, setDeviceInfo]);

  if (step === 'failed') {
    return (
      <Screen scroll={false}>
        <ErrorState
          actionLabel="重新搜索"
          description="请确认设备已开机并靠近手机后重试。"
          onAction={() => router.replace('/device/scan')}
          title="无法连接这台设备"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {step === 'ready' ? (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.full,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon color={colors.textOnAccent} icon={Check} size={18} />
          </View>
        ) : null}
        <Text variant="title-1">{STEP_LABEL[step]}</Text>
      </View>

      <SectionGap size={spacing.lg} />

      {/* 设备确认卡片（§7.7） */}
      <Card padding={spacing.lg} variant="raised">
        {!info ? (
          <Skeleton height={120} />
        ) : (
          <>
            <Text variant="title-2">{device?.name ?? '脉搏环 Pro'}</Text>
            <Text style={{ marginTop: 2 }} tone="secondary" variant="caption">
              SN {maskSn(info.sn)} · 固件 {info.firmware}
            </Text>

            <Divider />

            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text tone="secondary" variant="body-sm">
                  电量
                </Text>
                <BatteryIndicator level={info.battery} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text tone="secondary" variant="body-sm">
                  信号
                </Text>
                <SignalBars rssi={device?.rssi ?? -60} />
              </View>
            </View>
          </>
        )}
      </Card>

      <Text style={{ marginTop: spacing.md }} tone="secondary" variant="body-sm">
        设备指示灯正在闪烁，请确认是你的设备。
      </Text>

      <Button
        disabled={step !== 'ready'}
        fullWidth
        label="一键绑定"
        loading={binding}
        onPress={() => {
          if (!deviceId) return;
          setBinding(true);
          // 演示：绑定成功后记住设备并进入佩戴教学（§4.4.2）
          setTimeout(() => {
            rememberDevice(deviceId);
            setBinding(false);
            router.replace('/device/wear-guide');
          }, 600);
        }}
        size="lg"
        style={{ marginTop: spacing.lg }}
        testID="device-bind"
      />

      <Pressable
        accessibilityLabel="不是这台，重新搜索"
        onPress={() => router.replace('/device/scan')}
        style={{ alignItems: 'center', paddingVertical: spacing.sm }}
      >
        <Text tone="secondary" variant="body-sm">
          不是这台？重新搜索
        </Text>
      </Pressable>
    </Screen>
  );
}
