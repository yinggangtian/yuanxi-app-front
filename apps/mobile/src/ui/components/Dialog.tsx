import { Modal, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { radius, shadow, spacing } from '../tokens';
import { Button } from './Button';

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 危险操作（解绑、丢弃测量）用 danger 变体 */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

/** 确认弹窗（§6.10）：主次按钮。用于退出测量、解绑设备等二次确认。 */
export function Dialog({
  visible,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: DialogProps) {
  const { colors } = useTheme();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(14,26,34,0.4)',
          paddingHorizontal: spacing['2xl'],
        }}
      >
        <View
          style={[
            {
              width: '100%',
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.sm,
            },
            shadow('lg'),
          ]}
          testID={testID}
        >
          <Text variant="title-3">{title}</Text>
          {message ? (
            <Text tone="secondary" variant="body-sm">
              {message}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              style={{ flex: 1 }}
              variant="secondary"
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              style={{ flex: 1 }}
              variant={destructive ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
