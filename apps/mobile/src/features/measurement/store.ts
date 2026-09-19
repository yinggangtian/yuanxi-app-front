import { create } from 'zustand';

import type { QualityAssessment } from './engine/SignalQuality';
import type { MeasurementStage } from './engine/StageMachine';

/**
 * 测量流程状态（设计文档 §5.4）。
 *
 * ⚠️ **实时波形样本绝不进这里**（§5.4 规则：>10Hz 数据不进 React state / Zustand）。
 * 本 store 只存 1Hz 以下更新的低频状态：阶段、质量分、脉率、计时。
 * 波形走 RingBuffer → SharedValue 直达 UI 线程。
 */
export type MeasurementPhase =
  | 'idle'
  | 'preparing'
  | 'measuring'
  | 'paused'
  | 'analyzing'
  | 'completed'
  | 'failed';

interface MeasurementState {
  phase: MeasurementPhase;
  stage: MeasurementStage;
  stageLabel: string;
  stageIndex: number;
  stageCount: number;
  totalProgress: number;
  remainingSec: number;

  /** 1Hz 更新 */
  quality: QualityAssessment | null;
  /** 1Hz 更新；未稳定时为 null，UI 显示「--」 */
  bpm: number | null;
  /** 信号持续差，需弹出佩戴提示 */
  showWearHint: boolean;

  /** 本次测量生成的报告 id */
  reportId: string | null;
  /** 失败原因 */
  errorMessage: string | null;
  /** 断网时本地暂存的测量记录 id（§3.4 / §4.2.2 离线兜底） */
  pendingLocalId: string | null;

  setPhase: (phase: MeasurementPhase) => void;
  updateProgress: (progress: {
    stage: MeasurementStage;
    stageLabel: string;
    stageIndex: number;
    stageCount: number;
    totalProgress: number;
    remainingSec: number;
  }) => void;
  setQuality: (quality: QualityAssessment) => void;
  setBpm: (bpm: number | null) => void;
  setShowWearHint: (show: boolean) => void;
  succeed: (reportId: string) => void;
  fail: (message: string, pendingLocalId?: string) => void;
  reset: () => void;
}

const INITIAL = {
  phase: 'idle' as MeasurementPhase,
  stage: 'calibrating' as MeasurementStage,
  stageLabel: '校准',
  stageIndex: 1,
  stageCount: 5,
  totalProgress: 0,
  remainingSec: 0,
  quality: null,
  bpm: null,
  showWearHint: false,
  reportId: null,
  errorMessage: null,
  pendingLocalId: null,
};

export const useMeasurementStore = create<MeasurementState>((set) => ({
  ...INITIAL,

  setPhase: (phase) => set({ phase }),
  updateProgress: (progress) => set(progress),
  setQuality: (quality) => set({ quality }),
  setBpm: (bpm) => set({ bpm }),
  setShowWearHint: (showWearHint) => set({ showWearHint }),

  succeed: (reportId) => set({ phase: 'completed', reportId, errorMessage: null }),

  fail: (errorMessage, pendingLocalId) =>
    set({ phase: 'failed', errorMessage, pendingLocalId: pendingLocalId ?? null }),

  reset: () => set(INITIAL),
}));
