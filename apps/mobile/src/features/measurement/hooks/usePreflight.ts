import { useEffect, useState } from 'react';

import { useBleService } from './useBleService';
import { LOW_BATTERY_THRESHOLD, useDeviceStore, type ConnectionState } from '../../bluetooth';
import { SignalQualityEngine, type QualityAssessment } from '../engine/SignalQuality';


/**
 * 测量前预检（设计文档 §4.2.1）。
 *
 * 三项检查：已连接 ✓ / 电量 ≥20% ✓ / 佩戴贴合 ✓（试采 3s 信号质量）。
 * 全部通过才允许开始测量；任一不通过都要给出**具体的修复入口**。
 */
export type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

export interface PreflightCheck {
  key: 'connection' | 'battery' | 'fit';
  label: string;
  status: CheckStatus;
  /** 通过时的展示值，如设备名、电量 */
  detail: string;
  /** 未通过时的修复提示 */
  hint?: string;
}

/** 贴合度试采时长（§4.2.1）。 */
const FIT_SAMPLING_MS = 3000;

export function usePreflight(deviceId: string | null) {
  const service = useBleService();
  const connectionState = useDeviceStore((state) => state.connectionState);
  const battery = useDeviceStore((state) => state.battery);
  const deviceInfo = useDeviceStore((state) => state.deviceInfo);
  const setConnectionState = useDeviceStore((state) => state.setConnectionState);
  const setDeviceInfo = useDeviceStore((state) => state.setDeviceInfo);

  /**
   * 试采结果。`null` 表示尚未得到结论 —— 状态由它与连接态**推导**而来，
   * 不在 effect 里同步 setState（否则会触发级联渲染）。
   */
  const [fitResult, setFitResult] = useState<QualityAssessment | null>(null);
  /** 重试计数：变化时重新触发一次试采 */
  const [fitAttempt, setFitAttempt] = useState(0);

  /** 进入页面自动回连最近设备（§4.2.1）。 */
  useEffect(() => {
    if (!deviceId) return;

    const unsubscribe = service.onConnectionChange((state: ConnectionState) => {
      setConnectionState(state);
    });

    let cancelled = false;
    void (async () => {
      try {
        const info = await service.connect(deviceId);
        if (!cancelled) setDeviceInfo(info);
      } catch {
        // 连接失败由 connectionState 反映，此处不额外抛出
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [deviceId, service, setConnectionState, setDeviceInfo]);

  /**
   * 连接就绪后试采 3s 评估贴合度；setState 只发生在定时器回调中。
   *
   * 依赖用 `linkReady` 而不是 `connectionState`：试采本身会把连接态推进到
   * `measuring`，若直接依赖 `connectionState`，effect 会被自己触发的状态变化
   * 反复清理 / 重建（stopMeasurement → ready → startMeasurement → measuring → …），
   * 形成无限渲染循环。
   */
  const linkReady = connectionState === 'ready' || connectionState === 'measuring';

  useEffect(() => {
    if (!linkReady || fitResult !== null) return;

    const engine = new SignalQualityEngine();
    const unsubscribe = service.onSamples((batch) => engine.push(batch.samples));
    void service.startMeasurement({ sampleRate: 200, durationSec: FIT_SAMPLING_MS / 1000 });

    const timer = setTimeout(() => {
      setFitResult(engine.assess());
      unsubscribe();
      void service.stopMeasurement().catch(() => undefined);
    }, FIT_SAMPLING_MS);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      void service.stopMeasurement().catch(() => undefined);
    };
  }, [linkReady, fitResult, fitAttempt, service]);

  /** 由试采结果与连接态推导贴合检查状态。达到「良」以上即合格（§4.4.3）。 */
  const fitStatus: CheckStatus =
    fitResult === null
      ? connectionState === 'ready'
        ? 'checking'
        : 'pending'
      : fitResult.grade === 'poor'
        ? 'failed'
        : 'passed';

  const connectionPassed = connectionState === 'ready' || connectionState === 'measuring';
  const batteryPassed = battery !== null && battery >= LOW_BATTERY_THRESHOLD;

  const checks: PreflightCheck[] = [
    {
      key: 'connection',
      label: '设备已连接',
      status: connectionPassed ? 'passed' : connectionState === 'connecting' ? 'checking' : 'failed',
      detail: connectionPassed ? (deviceInfo?.model === 'ring-pro' ? '脉搏环 Pro' : '脉搏环') : '',
      hint: connectionPassed ? undefined : '请确认设备已开机并靠近手机',
    },
    {
      key: 'battery',
      label: '电量充足',
      status: battery === null ? 'checking' : batteryPassed ? 'passed' : 'failed',
      detail: battery === null ? '' : `${battery}%`,
      hint: batteryPassed ? undefined : `电量低于 ${LOW_BATTERY_THRESHOLD}%，请先充电后再测量`,
    },
    {
      key: 'fit',
      label:
        fitStatus === 'checking'
          ? '佩戴贴合检测中…'
          : fitStatus === 'failed'
            ? '佩戴贴合度不足'
            : '佩戴贴合',
      status: fitStatus,
      detail: fitResult && fitStatus === 'passed' ? fitResult.message : '',
      hint: fitStatus === 'failed' ? (fitResult?.message ?? '请调整佩戴位置后重试') : undefined,
    },
  ];

  const canStart = checks.every((check) => check.status === 'passed');

  const retryFitCheck = () => {
    setFitResult(null);
    setFitAttempt((attempt) => attempt + 1);
  };

  return { checks, canStart, retryFitCheck };
}
