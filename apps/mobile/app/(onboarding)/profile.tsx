import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Input,
  Pressable,
  Screen,
  SectionGap,
  Text,
  radius,
  spacing,
  useTheme,
} from '@/ui';

/**
 * 基础档案（设计文档 §2.3 路由守卫）。
 *
 * 首次测量前拦截到此页 —— 性别与年龄会影响脉象解读，
 * 缺失时报告结论不可靠，因此作为测量前置条件。
 */
export default function OnboardingProfileScreen() {
  const { colors } = useTheme();
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [birthYear, setBirthYear] = useState('');

  const yearValid = /^\d{4}$/.test(birthYear);
  const canContinue = gender !== null && yearValid;

  return (
    <Screen>
      <Text variant="title-1">完善基础信息</Text>
      <Text style={{ marginTop: spacing.xxs }} tone="secondary" variant="body-sm">
        性别与年龄会影响脉象的解读方式。完善后，报告结论会更贴合你的实际情况。
      </Text>

      <SectionGap size={spacing.xl} />

      <Card style={{ gap: spacing.md }}>
        <View style={{ gap: 6 }}>
          <Text tone="secondary" variant="body-sm">
            性别
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {(
              [
                { value: 'female', label: '女' },
                { value: 'male', label: '男' },
              ] as const
            ).map((option) => (
              <Pressable
                accessibilityLabel={option.label}
                accessibilityState={{ selected: gender === option.value }}
                key={option.value}
                onPress={() => setGender(option.value)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: gender === option.value ? colors.accent : colors.border,
                  backgroundColor: gender === option.value ? colors.accentSubtle : 'transparent',
                }}
              >
                <Text tone={gender === option.value ? 'accent' : 'secondary'} variant="body">
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          error={birthYear.length > 0 && !yearValid ? '请填写 4 位出生年份' : undefined}
          keyboardType="number-pad"
          label="出生年份"
          maxLength={4}
          numeric
          onChangeText={setBirthYear}
          placeholder="如 1994"
          value={birthYear}
        />
      </Card>

      <Button
        disabled={!canContinue}
        fullWidth
        label="开始首次脉诊"
        onPress={() => router.replace('/pulse')}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />

      <Text style={{ marginTop: spacing.sm, textAlign: 'center' }} tone="tertiary" variant="caption">
        这些信息仅用于生成你的健康报告，不会对外展示。
      </Text>
    </Screen>
  );
}
