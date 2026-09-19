import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { radius } from '../tokens';

export interface BadgeProps {
  /** 数字角标；省略则显示小红点 */
  count?: number;
  /** 超过此值显示 `99+` */
  max?: number;
  testID?: string;
}

/** 数字角标 / 小红点（§6.10）。count 为 0 时不渲染。 */
export function Badge({ count, max = 99, testID }: BadgeProps) {
  const { colors } = useTheme();

  if (count !== undefined && count <= 0) return null;

  // 小红点形态
  if (count === undefined) {
    return (
      <View
        accessibilityLabel="有新内容"
        style={{
          width: 8,
          height: 8,
          borderRadius: radius.full,
          backgroundColor: colors.danger,
        }}
        testID={testID}
      />
    );
  }

  const label = count > max ? `${max}+` : String(count);

  return (
    <View
      accessibilityLabel={`${count} 项`}
      style={{
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: radius.full,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID={testID}
    >
      <Text style={{ color: colors.textOnAccent }} variant="micro">
        {label}
      </Text>
    </View>
  );
}
