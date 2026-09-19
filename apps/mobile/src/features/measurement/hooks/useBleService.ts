import { createContext, useContext } from 'react';

import { MockBleService, type BleService } from '../../bluetooth';

/**
 * BleService 注入点。
 *
 * 默认使用 MockBleService，使模拟器与 E2E 无需硬件即可跑通全链路；
 * Dev Client / 正式包在根布局注入 `PlxBleService`（§5.5.1）。
 */
const defaultService: BleService = new MockBleService();

export const BleServiceContext = createContext<BleService>(defaultService);

export function useBleService(): BleService {
  return useContext(BleServiceContext);
}
