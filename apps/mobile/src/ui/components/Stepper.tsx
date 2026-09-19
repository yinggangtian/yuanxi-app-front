import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Icon, Pressable, Text } from '../primitives';
import { radius } from '../tokens';

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** 受库存与限购约束（§4.5.3） */
  max?: number;
  disabled?: boolean;
  testID?: string;
}

/** 数量增减（§6.10）：32pt 高，到达边界时对应按钮禁用。 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  testID,
}: StepperProps) {
  const { colors } = useTheme();
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        borderRadius: radius.sm,
        backgroundColor: colors.skeleton,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      <Pressable
        accessibilityLabel="减少数量"
        disabled={!canDecrease}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 2 }}
        onPress={() => onChange(value - 1)}
        style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={Minus} size={16} tone={canDecrease ? 'primary' : 'tertiary'} />
      </Pressable>

      <Text accessibilityLabel={`数量 ${value}`} style={{ minWidth: 28, textAlign: 'center' }} variant="body-sm">
        {value}
      </Text>

      <Pressable
        accessibilityLabel="增加数量"
        disabled={!canIncrease}
        hitSlop={{ top: 6, bottom: 6, left: 2, right: 6 }}
        onPress={() => onChange(value + 1)}
        style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={Plus} size={16} tone={canIncrease ? 'primary' : 'tertiary'} />
      </Pressable>
    </View>
  );
}
