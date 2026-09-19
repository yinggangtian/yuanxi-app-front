import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { CONSTITUTION_LABEL } from '@/api/schemas';
import { useProfile } from '@/features/profile';
import {
  Button,
  Card,
  Chip,
  Input,
  Pressable,
  Screen,
  SectionGap,
  SectionHeader,
  Skeleton,
  Text,
  radius,
  spacing,
  useOptionalToast,
  useTheme,
} from '@/ui';

/** 档案表单校验（§5.1：React Hook Form + Zod）。 */
const profileFormSchema = z.object({
  nickname: z.string().min(1, '请填写昵称').max(12, '昵称最多 12 个字'),
  gender: z.enum(['male', 'female'], { message: '请选择性别' }),
  birthYear: z
    .string()
    .regex(/^\d{4}$/, '请填写 4 位出生年份')
    .refine((value) => {
      const year = Number(value);
      const current = new Date().getFullYear();
      return year >= current - 120 && year <= current;
    }, '出生年份不在合理范围内'),
  heightCm: z.string().optional(),
  weightKg: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

/** 体质档案（设计文档 §4.6）。 */
export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const toast = useOptionalToast();

  const { control, handleSubmit, formState } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    values: {
      nickname: profile?.nickname ?? '',
      gender: profile?.gender === 'male' || profile?.gender === 'female' ? profile.gender : 'female',
      birthYear: profile?.birthYear ? String(profile.birthYear) : '',
      heightCm: profile?.heightCm ? String(profile.heightCm) : '',
      weightKg: profile?.weightKg ? String(profile.weightKg) : '',
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <Skeleton height={200} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="nickname"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="昵称"
              maxLength={12}
              onChangeText={field.onChange}
              placeholder="请输入昵称"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field, fieldState }) => (
            <View style={{ gap: 6 }}>
              <Text tone="secondary" variant="body-sm">
                性别
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <GenderOption
                  label="女"
                  onPress={() => field.onChange('female')}
                  selected={field.value === 'female'}
                />
                <GenderOption
                  label="男"
                  onPress={() => field.onChange('male')}
                  selected={field.value === 'male'}
                />
              </View>
              {fieldState.error ? (
                <Text tone="danger" variant="caption">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="birthYear"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              hint="用于结合年龄特征解读脉象"
              keyboardType="number-pad"
              label="出生年份"
              maxLength={4}
              numeric
              onChangeText={field.onChange}
              placeholder="如 1994"
              value={field.value}
            />
          )}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Controller
            control={control}
            name="heightCm"
            render={({ field }) => (
              <View style={{ flex: 1 }}>
                <Input
                  keyboardType="number-pad"
                  label="身高（cm）"
                  maxLength={3}
                  numeric
                  onChangeText={field.onChange}
                  placeholder="选填"
                  value={field.value ?? ''}
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="weightKg"
            render={({ field }) => (
              <View style={{ flex: 1 }}>
                <Input
                  keyboardType="number-pad"
                  label="体重（kg）"
                  maxLength={3}
                  numeric
                  onChangeText={field.onChange}
                  placeholder="选填"
                  value={field.value ?? ''}
                />
              </View>
            )}
          />
        </View>
      </Card>

      <SectionGap />

      {/* 体质标签由报告生成，不可手动编辑 */}
      <SectionHeader title="中医体质" />
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          {profile?.primaryConstitution ? (
            <Chip label={CONSTITUTION_LABEL[profile.primaryConstitution]} />
          ) : (
            <Text tone="secondary" variant="body-sm">
              完成首次脉诊后自动生成
            </Text>
          )}
          {profile?.secondaryConstitutions.map((type) => (
            <Chip key={type} label={`兼 ${CONSTITUTION_LABEL[type]}`} tone="neutral" />
          ))}
        </View>
        <Text style={{ marginTop: spacing.xs }} tone="tertiary" variant="caption">
          体质标签根据最近的脉诊报告自动更新，不支持手动修改。
        </Text>
      </Card>

      <Button
        disabled={!formState.isValid && formState.isSubmitted}
        fullWidth
        label="保存"
        loading={formState.isSubmitting}
        onPress={handleSubmit(() => {
          toast.show('档案已保存', 'success');
          router.back();
        })}
        size="lg"
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

function GenderOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        height: 44,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accentSubtle : 'transparent',
      }}
    >
      <Text tone={selected ? 'accent' : 'secondary'} variant="body">
        {label}
      </Text>
    </Pressable>
  );
}
