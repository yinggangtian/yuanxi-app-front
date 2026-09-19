import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { CARD_PADDING, radius, shadow } from '../tokens';

export type CardVariant = 'plain' | 'raised' | 'outline';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * 卡片（§6.10）。
 *
 * 默认 `plain` **无投影** —— 仅靠白卡与 ink-50 页面底色的明度差区分层级（§6.5）。
 * 只有真正浮起的元素（主卡、浮动按钮）才用 `raised`。
 */
export function Card({
  children,
  variant = 'plain',
  padding = CARD_PADDING,
  style,
  testID,
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: variant === 'raised' ? colors.surfaceRaised : colors.surface,
          borderRadius: radius.lg,
          padding,
        },
        variant === 'outline' ? { borderWidth: 1, borderColor: colors.border } : null,
        variant === 'raised' ? shadow('md') : null,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
