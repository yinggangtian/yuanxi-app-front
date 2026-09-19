import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Pressable, Text } from '../primitives';
import { radius, shadow, spacing } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** 品牌光晕，仅用于脉诊主按钮等「品牌时刻」（§6.5 glow-primary）。 */
  glow?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 尺寸规格（§6.10）：lg 52pt / md 44pt / sm 32pt。 */
const SIZE_SPEC: Record<ButtonSize, { height: number; paddingX: number }> = {
  lg: { height: 52, paddingX: spacing.xl },
  md: { height: 44, paddingX: spacing.md },
  sm: { height: 32, paddingX: spacing.sm },
};

const TEXT_VARIANT: Record<ButtonSize, 'body' | 'body-sm'> = {
  lg: 'body',
  md: 'body',
  sm: 'body-sm',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  glow = false,
  fullWidth = false,
  left,
  right,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const spec = SIZE_SPEC[size];
  const inactive = disabled || loading;

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: colors.accentSubtle },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
  };

  const labelTone = {
    primary: 'onAccent',
    secondary: 'accent',
    ghost: 'accent',
    danger: 'onAccent',
  } as const;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        {
          height: spec.height,
          paddingHorizontal: spec.paddingX,
          borderRadius: variant === 'ghost' ? radius.sm : radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.xs,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          // 禁用态降低不透明度而非换色，避免与语义色混淆
          opacity: inactive ? 0.45 : 1,
        },
        surface[variant],
        glow && !inactive ? shadow('glowPrimary') : null,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.textOnAccent : colors.accent}
          size="small"
        />
      ) : (
        <>
          {left ? <View>{left}</View> : null}
          <Text numberOfLines={1} tone={labelTone[variant]} variant={TEXT_VARIANT[size]}>
            {label}
          </Text>
          {right ? <View>{right}</View> : null}
        </>
      )}
    </Pressable>
  );
}
