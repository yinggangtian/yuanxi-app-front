import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Pressable } from '../primitives';
import { radius } from '../tokens';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  testID?: string;
}

/** 圆形 22pt，选中为 primary-500 实心 + 白色对勾（§6.10）。 */
export function Checkbox({
  checked,
  onChange,
  disabled = false,
  accessibilityLabel,
  testID,
}: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      testID={testID}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? colors.accent : 'transparent',
          borderWidth: checked ? 0 : 1.5,
          borderColor: colors.borderStrong,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {checked ? <Check color={colors.textOnAccent} size={14} strokeWidth={2.5} /> : null}
      </View>
    </Pressable>
  );
}
