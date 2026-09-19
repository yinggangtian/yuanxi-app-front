import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ADAPTER_STATE_MESSAGE,
  useDeviceStore,
  type BleAdapterState,
  type DiscoveredDevice,
} from '@/features/bluetooth';
import { RadarScan, SignalBars } from '@/features/device';
import { useBleService } from '@/features/measurement';
import { maskSn } from '@/lib/format';
import {
  Button,
  Card,
  GlassCard,
  PAGE_PADDING,
  Pressable,
  Text,
  spacing,
  useTheme,
} from '@/ui';

/** 扫描超时（§4.4.1：30s 未发现设备则给出帮助）。 */
const SCAN_TIMEOUT_MS = 30_000;

/** 开启蓝牙与搜索（设计文档 §4.4.1 / §7.6）。 */
export default function DeviceScanScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const service = useBleService();

  const discovered = useDeviceStore((state) => state.discovered);
  const upsertDiscovered = useDeviceStore((state) => state.upsertDiscovered);
  const clearDiscovered = useDeviceStore((state) => state.clearDiscovered);

  const [adapterState, setAdapterState] = useState<BleAdapterState>('unknown');
  const [timedOut, setTimedOut] = useState(false);
  const [scanToken, setScanToken] = useState(0);

  /** 监听蓝牙适配器状态（§3.4 蓝牙关闭链路）。 */
  useEffect(() => {
    let mounted = true;
    void service.getAdapterState().then((state) => {
      if (mounted) setAdapterState(state);
    });
    const unsubscribe = service.onAdapterStateChange(setAdapterState);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [service]);

  /** 蓝牙就绪后开始扫描。 */
  useEffect(() => {
    if (adapterState !== 'poweredOn') return;

    clearDiscovered();
    const stopScan = service.scan({ timeoutMs: SCAN_TIMEOUT_MS }, (device: DiscoveredDevice) => {
      upsertDiscovered(device);
    });

    const timer = setTimeout(() => setTimedOut(true), SCAN_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      stopScan();
    };
  }, [adapterState, scanToken, service, clearDiscovered, upsertDiscovered]);

  const bluetoothOff = adapterState !== 'poweredOn' && adapterState !== 'unknown';
  const showHelp = timedOut && discovered.length === 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: PAGE_PADDING,
      }}
    >
      {/* 稍后再说（§4.4.1：可跳过绑定） */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="稍后再说" onPress={() => router.replace('/')}>
          <Text tone="secondary" variant="body-sm">
            稍后再说
          </Text>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <RadarScan active={!bluetoothOff} />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.xxs }}>
        <Text variant="title-2">
          {bluetoothOff ? ADAPTER_STATE_MESSAGE[adapterState] : '正在寻找你的脉搏环…'}
        </Text>
        <Text tone="secondary" variant="body-sm">
          {bluetoothOff
            ? '开启蓝牙后，元息才能搜索并连接你的脉搏环。'
            : '请将设备靠近手机，长按按键 3 秒开机。'}
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end', gap: spacing.sm }}>
        {/* 蓝牙关闭引导（§7.6） */}
        {bluetoothOff ? (
          <Card>
            <Text variant="title-3">请开启手机蓝牙</Text>
            <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
              {adapterState === 'unauthorized'
                ? '元息需要蓝牙权限才能连接脉搏环，请在系统设置中允许。'
                : '在控制中心或系统设置中开启蓝牙后，搜索会自动继续。'}
            </Text>
            <Button
              fullWidth
              label="去开启"
              onPress={() => void service.requestPermissions()}
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ) : null}

        {/* 超时帮助（§4.4.1） */}
        {showHelp ? (
          <Card>
            <Text variant="title-3">还是找不到设备？</Text>
            <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
              · 确认脉搏环已开机（长按按键 3 秒，指示灯亮起）{'\n'}
              · 将设备放在手机附近 30cm 内{'\n'}
              · 确认设备未与其它手机保持连接
            </Text>
            <Button
              fullWidth
              label="重新搜索"
              onPress={() => {
                setTimedOut(false);
                setScanToken((token) => token + 1);
              }}
              size="lg"
              style={{ marginTop: spacing.sm }}
              variant="secondary"
            />
          </Card>
        ) : null}

        {/* 发现列表：按 RSSI 排序，从底部弹出（§4.4.1） */}
        {discovered.map((device) => (
          <Pressable
            accessibilityLabel={`连接 ${device.name}`}
            key={device.id}
            onPress={() =>
              router.push({ pathname: '/device/confirm', params: { deviceId: device.id } })
            }
            testID={`discovered-${device.id}`}
          >
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="title-3">{device.name}</Text>
                  <Text tone="secondary" variant="caption">
                    {device.sn ? maskSn(device.sn) : device.id}
                  </Text>
                </View>
                <SignalBars rssi={device.rssi} />
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <Pressable
          accessibilityLabel="扫码或输入 SN 添加设备"
          onPress={() => router.push('/device/manual')}
          style={{ alignItems: 'center', paddingVertical: spacing.xs }}
        >
          <Text style={{ color: colors.accentText }} variant="body-sm">
            找不到设备？扫码 / 输入 SN 添加
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
