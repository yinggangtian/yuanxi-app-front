/** measurement feature 公共出口（设计文档 §5.2）。 */
export { PeakDetector } from './engine/PeakDetector';
export { RingBuffer } from './engine/RingBuffer';
export {
  describeQuality,
  gradeFromScore,
  GRADE_THRESHOLD,
  SignalQualityEngine,
  type PoorReason,
  type QualityAssessment,
  type SignalGrade,
} from './engine/SignalQuality';
export {
  POOR_SIGNAL_HINT_DELAY_MS,
  STAGES,
  StageMachine,
  TOTAL_DURATION_SEC,
  type MeasurementStage,
  type StageProgress,
} from './engine/StageMachine';
export { SignalQualityBadge } from './components/SignalQualityBadge';
export { StageProgressRing } from './components/StageProgressRing';
export { BleServiceContext, useBleService } from './hooks/useBleService';
export { useMeasurementSession } from './hooks/useMeasurementSession';
export { usePreflight, type CheckStatus, type PreflightCheck } from './hooks/usePreflight';
export { useMeasurementStore, type MeasurementPhase } from './store';
