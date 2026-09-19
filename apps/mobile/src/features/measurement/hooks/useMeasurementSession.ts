import { useEffect, useRef } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { logger } from '../../../lib/logger';
import { PeakDetector } from '../engine/PeakDetector';
import { RingBuffer } from '../engine/RingBuffer';
import { SignalQualityEngine } from '../engine/SignalQuality';
import { StageMachine } from '../engine/StageMachine';
import { useMeasurementStore } from '../store';

import { useBleService } from './useBleService';

/**
 * 测量会话 —— 实时数据管线（设计文档 §5.6）。
 *
 * ```text
 * BLE onSamples（~40ms/批）
 *   ├──► SignalQuality 引擎（1s 滑窗）──► store.quality（1Hz）
 *   ├──► PeakDetector ────────────────► store.bpm（1Hz）
 *   └──► RingBuffer（5s 窗口）────────► SharedValue（~25Hz）──► Skia（UI 线程 60fps）
 * ```
 *
 * 关键约束：
 * 1. 波形样本**只经 SharedValue** 进入 UI，不走 React state（§5.4 / §5.6 要点 3）
 * 2. JS ↔ UI 线程通信频率 ≤25Hz（§5.6 要点 1）
 * 3. 质量分与脉率以 1Hz 更新，避免每批都触发重渲染
 */

/** 波形窗口时长（§4.2.2：显示最近 5s）。 */
const WINDOW_SECONDS = 5;
/** SharedValue 写入频率上限 25Hz → 40ms（§5.6 要点 1）。 */
const SHARED_VALUE_INTERVAL_MS = 40;
/** 低频状态更新频率 1Hz。 */
const STORE_UPDATE_INTERVAL_MS = 1000;
/** 进度推进的计时间隔。 */
const TICK_INTERVAL_MS = 200;

export interface MeasurementSession {
  /** 传给 WaveformCanvas 的波形窗口 */
  waveform: SharedValue<number[]>;
}

export function useMeasurementSession(options: {
  sampleRate?: number;
  enabled: boolean;
  onCompleted: () => void;
}): MeasurementSession {
  const { sampleRate = 200, enabled, onCompleted } = options;
  const service = useBleService();

  const waveform = useSharedValue<number[]>([]);

  const setPhase = useMeasurementStore((state) => state.setPhase);
  const setQuality = useMeasurementStore((state) => state.setQuality);
  const setBpm = useMeasurementStore((state) => state.setBpm);
  const setShowWearHint = useMeasurementStore((state) => state.setShowWearHint);
  const updateProgress = useMeasurementStore((state) => state.updateProgress);

  /** 回调闭包随 onCompleted 变化，用 ref 固定，避免重复建立会话。 */
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    if (!enabled) return;

    const buffer = new RingBuffer(sampleRate * WINDOW_SECONDS);
    const quality = new SignalQualityEngine(sampleRate);
    const peaks = new PeakDetector(sampleRate);
    const stages = new StageMachine();

    // 复用数组，避免每次导出都分配新数组（§5.6）
    const exportTarget: number[] = [];
    let signalOk = false;
    let finished = false;

    setPhase('measuring');

    const unsubscribeSamples = service.onSamples((batch) => {
      // 高频路径：只写缓冲与引擎，**不触发任何 React 更新**
      buffer.pushBatch(batch.samples);
      quality.push(batch.samples);
      peaks.push(batch.samples, batch.timestamp);
    });

    // 25Hz：把波形窗口推给 UI 线程
    const waveformTimer = setInterval(() => {
      buffer.toArray(exportTarget);
      // SharedValue 需要新引用才会触发 worklet 重算
      waveform.value = exportTarget.slice();
    }, SHARED_VALUE_INTERVAL_MS);

    // 1Hz：质量分与脉率
    const storeTimer = setInterval(() => {
      const assessment = quality.assess();
      signalOk = assessment.shouldAdvance;
      setQuality(assessment);
      setBpm(peaks.bpm);
    }, STORE_UPDATE_INTERVAL_MS);

    // 进度推进：信号差时不计入有效时间（§4.2.2）
    let lastTick = Date.now();
    const tickTimer = setInterval(() => {
      const now = Date.now();
      stages.advance(now - lastTick, signalOk);
      lastTick = now;

      const progress = stages.progress;
      updateProgress({
        stage: progress.stage,
        stageLabel: progress.stageLabel,
        stageIndex: progress.stageIndex,
        stageCount: progress.stageCount,
        totalProgress: progress.totalProgress,
        remainingSec: progress.remainingSec,
      });
      setShowWearHint(stages.shouldShowWearHint);

      if (progress.completed && !finished) {
        finished = true;
        setPhase('analyzing');
        onCompletedRef.current();
      }
    }, TICK_INTERVAL_MS);

    void service
      .startMeasurement({ sampleRate, durationSec: 75 })
      .catch((error: unknown) => logger.error('启动测量失败', { error: String(error) }));

    return () => {
      clearInterval(waveformTimer);
      clearInterval(storeTimer);
      clearInterval(tickTimer);
      unsubscribeSamples();
      void service.stopMeasurement().catch(() => undefined);
    };
  }, [
    enabled,
    sampleRate,
    service,
    setBpm,
    setPhase,
    setQuality,
    setShowWearHint,
    updateProgress,
    waveform,
  ]);

  return { waveform };
}
