import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { radius, spacing, typographyStyle } from '../tokens';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** 错误提示；存在时输入框显示 danger 描边（§6.10） */
  error?: string;
  hint?: string;
  right?: React.ReactNode;
  /** 数字输入（验证码、SN）使用等宽数字 */
  numeric?: boolean;
}

/** 输入框 / 表单字段（§6.10）。与 React Hook Form 通过 Controller 绑定。 */
export function Input({ label, error, hint, right, numeric = false, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.accent : 'transparent';

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text tone="secondary" variant="body-sm">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.skeleton,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: spacing.sm,
          minHeight: 44,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          placeholderTextColor={colors.textTertiary}
          style={[
            typographyStyle('body'),
            numeric ? { fontVariant: ['tabular-nums'] } : null,
            { flex: 1, color: colors.textPrimary, paddingVertical: spacing.xs },
          ]}
          {...rest}
        />
        {right}
      </View>

      {error ? (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      ) : hint ? (
        <Text tone="tertiary" variant="caption">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
