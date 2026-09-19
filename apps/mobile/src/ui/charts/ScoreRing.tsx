import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { palette } from '../tokens';

import { SCORE_RING_START_ANGLE, SCORE_RING_SWEEP, clamp, scoreToSweepAngle } from './geometry';

export interface ScoreRingProps {
  /** 综合健康评分 0–100 */
  score: number;
  /** 等级文字，如「良好」 */
  level?: string;
  size?: number;
  /** 轨道与进度线宽，默认 12pt（§6.9） */
  strokeWidth?: number;
  /** 中心分数字号；小尺寸场景传 'metric' */
  scoreVariant?: 'display' | 'metric-lg' | 'metric';
  testID?: string;
}

/**
 * 评分环（设计文档 §6.9）。
 *
 * 270° 开口环，缺口朝下；轨道 ink-100，进度 primary-500 圆头；
 * 中心为 display 字号分数 + caption 等级。
 */
export function ScoreRing({
  score,
  level,
  size = 180,
  strokeWidth = 12,
  scoreVariant = 'display',
  testID,
}: ScoreRingProps) {
  const { colors, isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const sweep = scoreToSweepAngle(score);
  const displayScore = Math.round(clamp(score, 0, 100));

  // Skia 的 addArc 以 3 点钟方向为 0°，而几何模块以 12 点钟为 0°，故减 90。
  // 结果：-225° ≡ 135°（左下）起，顺时针扫 270° 至 45°（右下），缺口朝正下方。
  const skiaStartAngle = SCORE_RING_START_ANGLE - 90;

  const arcRect = {
    x: strokeWidth / 2,
    y: strokeWidth / 2,
    width: radius * 2,
    height: radius * 2,
  };

  const trackPath = Skia.Path.Make();
  trackPath.addArc(arcRect, skiaStartAngle, SCORE_RING_SWEEP);

  const progressPath = Skia.Path.Make();
  progressPath.addArc(arcRect, skiaStartAngle, sweep);

  return (
    <View
      accessibilityLabel={`综合健康评分 ${displayScore} 分${level ? `，${level}` : ''}`}
      accessibilityRole="image"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      testID={testID}
    >
      <Canvas style={{ position: 'absolute', width: size, height: size }}>
        <Path
          color={isDark ? colors.border : palette.ink[100]}
          path={trackPath}
          strokeCap="round"
          strokeWidth={strokeWidth}
          style="stroke"
        />
        <Path
          color={colors.accent}
          path={progressPath}
          strokeCap="round"
          strokeWidth={strokeWidth}
          style="stroke"
        />
      </Canvas>

      <View style={{ alignItems: 'center' }}>
        <Text variant={scoreVariant}>{displayScore}</Text>
        {level ? (
          <Text tone="secondary" variant="caption">
            {level}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
