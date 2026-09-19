import type { ConnectionState } from '../../domain/ConnectionMachine';
import { MockBleService } from '../MockBleService';
import { rssiToBars, rssiToLabel } from '../types';

jest.useFakeTimers();

describe('MockBleService —— 扫描与连接', () => {
  it('扫描后按预期延迟发现设备', () => {
    const service = new MockBleService({ discoverDelayMs: 500 });
    const found = jest.fn();

    service.scan({ timeoutMs: 30_000 }, found);
    expect(found).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(found).toHaveBeenCalledTimes(1);
    expect(found.mock.calls[0]![0]).toMatchObject({ model: 'ring-pro' });

    service.dispose();
  });

  it('neverDiscover 时在超时后回到 idle（演练 §3.4 搜索 30s 无设备）', () => {
    const service = new MockBleService({ neverDiscover: true });
    const states: ConnectionState[] = [];
    service.onConnectionChange((state) => states.push(state));

    service.scan({ timeoutMs: 30_000 }, jest.fn());
    jest.advanceTimersByTime(30_000);

    expect(states).toContain('scanning');
    expect(states[states.length - 1]).toBe('idle');

    service.dispose();
  });

  it('连接后进入 ready 并回传设备信息', async () => {
    const service = new MockBleService({ connectDelayMs: 100 });
    const battery = jest.fn();
    service.onBattery(battery);

    const promise = service.connect('mock-device-0001');
    await jest.advanceTimersByTimeAsync(100);
    const info = await promise;

    expect(info.model).toBe('ring-pro');
    expect(info.battery).toBeGreaterThan(0);
    expect(battery).toHaveBeenCalledWith(info.battery);

    service.dispose();
  });

  it('订阅连接状态时立即收到当前状态', () => {
    const service = new MockBleService();
    const listener = jest.fn();
    service.onConnectionChange(listener);

    expect(listener).toHaveBeenCalledWith('idle');
    service.dispose();
  });
});

describe('MockBleService —— 测量采样', () => {
  async function connected(options = {}) {
    const service = new MockBleService({ connectDelayMs: 0, ...options });
    const promise = service.connect('mock-device-0001');
    await jest.advanceTimersByTimeAsync(0);
    await promise;
    return service;
  }

  it('按批回调样本，批大小符合采样率 × 间隔', async () => {
    const service = await connected({ batchIntervalMs: 40 });
    const batches: number[] = [];
    service.onSamples((batch) => batches.push(batch.samples.length));

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    jest.advanceTimersByTime(200); // 5 批

    expect(batches.length).toBe(5);
    // 200Hz × 40ms = 8 样本/批（§5.6）
    expect(batches[0]).toBe(8);

    service.dispose();
  });

  it('样本落在归一化区间 [-1, 1]', async () => {
    const service = await connected({});
    const values: number[] = [];
    service.onSamples((batch) => values.push(...batch.samples));

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    jest.advanceTimersByTime(1000);

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }

    service.dispose();
  });

  it('合成波形具有周期性峰值（可用于验证波形绘制）', async () => {
    const service = await connected({ signalProfile: 'good' });
    const values: number[] = [];
    service.onSamples((batch) => values.push(...batch.samples));

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    // 采集 3 秒，72bpm 下约有 3–4 个心搏
    jest.advanceTimersByTime(3000);

    const max = Math.max(...values);
    const min = Math.min(...values);
    // 峰谷之间应有明显落差，而不是一条直线
    expect(max - min).toBeGreaterThan(0.5);

    service.dispose();
  });

  it('停止测量后不再回调样本', async () => {
    const service = await connected({});
    const listener = jest.fn();
    service.onSamples(listener);

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    jest.advanceTimersByTime(120);
    const callsWhileMeasuring = listener.mock.calls.length;
    expect(callsWhileMeasuring).toBeGreaterThan(0);

    await service.stopMeasurement();
    jest.advanceTimersByTime(500);

    expect(listener.mock.calls.length).toBe(callsWhileMeasuring);
    service.dispose();
  });

  it('断链停止采样；重连后恢复测量（§3.4）', async () => {
    const service = await connected({});
    const states: ConnectionState[] = [];
    service.onConnectionChange((state) => states.push(state));

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    jest.advanceTimersByTime(80);

    service.simulateLinkLost();
    expect(states[states.length - 1]).toBe('reconnecting');

    service.simulateReconnected();
    expect(states[states.length - 1]).toBe('measuring');

    service.dispose();
  });

  it('dispose 后定时器全部释放', async () => {
    const service = await connected({});
    const listener = jest.fn();
    service.onSamples(listener);

    await service.startMeasurement({ sampleRate: 200, durationSec: 60 });
    service.dispose();

    jest.advanceTimersByTime(1000);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('MockBleService —— 适配器状态', () => {
  it('蓝牙关闭状态可被订阅到（演练 §3.4 蓝牙关闭链路）', () => {
    const service = new MockBleService({ adapterState: 'poweredOff' });
    const listener = jest.fn();
    service.onAdapterStateChange(listener);

    service.setAdapterState('poweredOn');
    expect(listener).toHaveBeenCalledWith('poweredOn');

    service.dispose();
  });

  it('未授权时权限申请返回 false', async () => {
    const service = new MockBleService({ adapterState: 'unauthorized' });
    await expect(service.requestPermissions()).resolves.toBe(false);
    service.dispose();
  });
});

describe('RSSI 映射（§4.4.2 信号强度 4 格）', () => {
  it('分档随信号增强递增', () => {
    expect(rssiToBars(-50)).toBe(4);
    expect(rssiToBars(-60)).toBe(3);
    expect(rssiToBars(-75)).toBe(2);
    expect(rssiToBars(-95)).toBe(1);
  });

  it('每一档都有对应文字，不靠颜色单独表达', () => {
    expect(rssiToLabel(-50)).toBe('很强');
    expect(rssiToLabel(-95)).toBe('弱');
  });
});
