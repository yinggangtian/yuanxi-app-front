import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';

import { palette, Text } from '../../../ui';

export interface StageProgressRingProps {
  /** 总进度 0–1 */
  progress: number;
  stageLabel: string;
  stageIndex: number;
  stageCount: number;
  /** 实时脉率；null 时显示「--」 */
  bpm: number | null;
  remainingSec: number;
  /** 信号差导致暂停 */
  paused: boolean;
  size?: number;
}

/** 测量进度环（设计文档 §7.4）：200pt，中心为实时脉率。 */
export function StageProgressRing({
  progress,
  stageLabel,
  stageIndex,
  stageCount,
  bpm,
  remainingSec,
  paused,
  size = 200,
}: StageProgressRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const rect = { x: strokeWidth / 2, y: strokeWidth / 2, width: radius * 2, height: radius * 2 };

  const track = Skia.Path.Make();
  track.addArc(rect, 0, 360);

  const bar = Skia.Path.Make();
  bar.addArc(rect, -90, Math.max(0, Math.min(progress, 1)) * 360);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const countdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View
      accessibilityLabel={`${stageLabel}，第 ${stageIndex} / ${stageCount} 阶段，剩余 ${countdown}`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Canvas style={{ position: 'absolute', width: size, height: size }}>
        <Path
          color="rgba(255,255,255,0.12)"
          path={track}
          strokeWidth={strokeWidth}
          style="stroke"
        />
        <Path
          color={paused ? palette.ink[400] : palette.primary[300]}
          path={bar}
          strokeCap="round"
          strokeWidth={strokeWidth}
          style="stroke"
        />
      </Canvas>

      <Text style={{ color: 'rgba(255,255,255,0.72)' }} variant="caption">
        {stageLabel} {stageIndex}/{stageCount}
      </Text>

      <Text style={{ color: '#FFFFFF' }} variant="metric-lg">
        {bpm ?? '--'}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.72)' }} variant="caption">
        次/分
      </Text>

      <Text style={{ color: 'rgba(255,255,255,0.56)', marginTop: 4 }} variant="caption">
        {paused ? '‖ 已暂停' : countdown}
      </Text>
    </View>
  );
}
