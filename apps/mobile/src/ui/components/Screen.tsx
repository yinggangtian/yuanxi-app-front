import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../hooks/useTheme';
import { PAGE_PADDING, spacing } from '../tokens';

export interface ScreenProps {
  children: React.ReactNode;
  /** 是否可滚动，默认是 */
  scroll?: boolean;
  /** 左右是否使用 20pt 页面边距（§6.4），全宽内容传 false */
  padded?: boolean;
  /** 底部固定栏高度，避免内容被遮挡 */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 页面容器：统一页面底色、左右 20pt 边距与安全区处理。 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomInset = 0,
  style,
  contentStyle,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content: StyleProp<ViewStyle> = [
    padded ? { paddingHorizontal: PAGE_PADDING } : null,
    { paddingBottom: bottomInset + insets.bottom + spacing.xl },
    contentStyle,
  ];

  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg }, style]} testID={testID}>
        <View style={[{ flex: 1 }, content]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={content}
      showsVerticalScrollIndicator={false}
      style={[{ flex: 1, backgroundColor: colors.bg }, style]}
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}

/** 模块之间的标准间隔（§6.4：24–32pt）。 */
export function SectionGap({ size = spacing.xl }: { size?: number }) {
  return <View style={{ height: size }} />;
}

/** 分割线。 */
export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: 1, marginLeft: inset, backgroundColor: colors.border }} />;
}

