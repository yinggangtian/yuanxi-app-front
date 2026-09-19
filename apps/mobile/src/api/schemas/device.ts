import { z } from 'zod';

export const deviceModelSchema = z.enum(['ring-pro', 'ring']);
export type DeviceModel = z.infer<typeof deviceModelSchema>;

export const DEVICE_MODEL_LABEL: Record<DeviceModel, string> = {
  'ring-pro': '脉搏环 Pro',
  ring: '脉搏环',
};

/** 服务端记录的已绑定设备。 */
export const boundDeviceSchema = z.object({
  id: z.string(),
  /** BLE 侧标识：iOS 为 UUID，Android 为 MAC */
  bleId: z.string(),
  sn: z.string(),
  model: deviceModelSchema,
  name: z.string(),
  firmware: z.string(),
  /** 服务端已知的最新固件版本；无更新时与 firmware 相同 */
  latestFirmware: z.string().nullable().default(null),
  boundAt: z.string(),
  lastSyncAt: z.string().nullable().default(null),
});

export type BoundDevice = z.infer<typeof boundDeviceSchema>;

/** 是否有固件更新。 */
export function hasFirmwareUpdate(device: BoundDevice): boolean {
  return device.latestFirmware !== null && device.latestFirmware !== device.firmware;
}
