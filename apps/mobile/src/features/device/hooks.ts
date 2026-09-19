import { useQuery } from '@tanstack/react-query';

import { queryKeys, staleTimes } from '../../api/queryKeys';
import type { BoundDevice } from '../../api/schemas/device';
import { hasFirmwareUpdate } from '../../api/schemas/device';
import { mockDevice } from '../../mocks';
import { LOW_BATTERY_THRESHOLD, useDeviceStore } from '../bluetooth';

/**
 * 已绑定设备。
 *
 * 目前由 mock 驱动；接入服务端时只需替换 queryFn 为
 * `api.get('/devices', boundDeviceSchema.array())`，页面无需改动。
 */
export function useBoundDevice() {
  return useQuery({
    queryKey: queryKeys.device.list(),
    queryFn: async (): Promise<BoundDevice | null> => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return mockDevice;
    },
    staleTime: staleTimes.detail,
  });
}

/** 是否有固件更新。 */
export function useFirmwareUpdate(): boolean {
  const { data } = useBoundDevice();
  return data ? hasFirmwareUpdate(data) : false;
}

/**
 * 「我的」Tab 上的小红点（§2.1）：设备未连接或低电量时点亮。
 *
 * 未绑定设备时不提示 —— 那是首页无设备态要引导的事，不该在 Tab 上报警。
 */
export function useDeviceAlert(): boolean {
  const { data } = useBoundDevice();
  const connectionState = useDeviceStore((state) => state.connectionState);
  const battery = useDeviceStore((state) => state.battery);

  if (!data) return false;
  if (battery !== null && battery < LOW_BATTERY_THRESHOLD) return true;
  return connectionState === 'idle';
}
