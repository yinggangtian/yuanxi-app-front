import { Modal, Pressable as RNPressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../hooks/useTheme';
import { Text } from '../primitives';
import { PAGE_PADDING, radius, shadow, spacing } from '../tokens';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 点击遮罩是否关闭；支付确认等关键流程可关闭此行为 */
  dismissOnBackdropPress?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * 底部弹层（§6.10）：radius-xl 顶角 + 拖拽把手。
 *
 * 用 Modal 而非路由级 Sheet，便于在任意页面内就地弹出（SKU 选择、优惠明细）。
 * 路由级的支付确认页请用 Expo Router 的 formSheet presentation。
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  dismissOnBackdropPress = true,
  style,
  testID,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <RNPressable
          accessibilityLabel="关闭"
          onPress={dismissOnBackdropPress ? onClose : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(14,26,34,0.4)' }}
        />
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: PAGE_PADDING,
              paddingTop: spacing.sm,
              paddingBottom: insets.bottom + spacing.lg,
            },
            shadow('lg'),
            style,
          ]}
          testID={testID}
        >
          {/* 拖拽把手 */}
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: radius.full,
              backgroundColor: colors.border,
              marginBottom: spacing.sm,
            }}
          />
          {title ? (
            <Text style={{ marginBottom: spacing.sm }} variant="title-2">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
