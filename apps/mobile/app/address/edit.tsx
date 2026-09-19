import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { useAddresses } from '@/features/order';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Screen,
  SectionGap,
  Text,
  spacing,
  useOptionalToast,
} from '@/ui';

const addressFormSchema = z.object({
  receiver: z.string().min(1, '请填写收货人'),
  // 中国大陆手机号
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请填写正确的手机号'),
  region: z.string().min(1, '请填写所在地区'),
  detail: z.string().min(4, '详细地址不少于 4 个字'),
  isDefault: z.boolean(),
});

type AddressForm = z.infer<typeof addressFormSchema>;

/** 新增 / 编辑地址（设计文档 §4.6）。 */
export default function AddressEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: addresses } = useAddresses();
  const toast = useOptionalToast();

  const existing = addresses?.find((address) => address.id === id);

  const { control, handleSubmit } = useForm<AddressForm>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      receiver: existing?.receiver ?? '',
      phone: existing?.phone ?? '',
      region: existing ? `${existing.province}${existing.city}${existing.district}` : '',
      detail: existing?.detail ?? '',
      isDefault: existing?.isDefault ?? false,
    },
  });

  return (
    <Screen>
      <Card style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="receiver"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="收货人"
              onChangeText={field.onChange}
              placeholder="请填写收货人姓名"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              keyboardType="phone-pad"
              label="手机号"
              maxLength={11}
              numeric
              onChangeText={field.onChange}
              placeholder="请填写手机号"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="region"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="所在地区"
              onChangeText={field.onChange}
              placeholder="省 / 市 / 区"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="detail"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="详细地址"
              multiline
              onChangeText={field.onChange}
              placeholder="街道、门牌号等"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Checkbox
                accessibilityLabel="设为默认地址"
                checked={field.value}
                onChange={field.onChange}
              />
              <Text variant="body-sm">设为默认地址</Text>
            </View>
          )}
        />
      </Card>

      <SectionGap />

      <Button
        fullWidth
        label="保存"
        onPress={handleSubmit(() => {
          toast.show('地址已保存', 'success');
          router.back();
        })}
        size="lg"
      />
    </Screen>
  );
}
