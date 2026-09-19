import { Tabs } from 'expo-router';
import { Activity, FileText, House, ShoppingBag, User } from 'lucide-react-native';
import { View } from 'react-native';

import { useCartBadge } from '@/features/cart';
import { useDeviceAlert } from '@/features/device';
import {
  CENTER_BUTTON_LIFT,
  CENTER_BUTTON_SIZE,
  Icon,
  TAB_BAR_HEIGHT,
  TabBarContainer,
  TabBarItem,
  radius,
  shadow,
  useTheme,
} from '@/ui';

/**
 * 底部 TabBar（设计文档 §2.1 / §7.1）。
 *
 * 顺序：首页 / 报告 / **脉诊（居中凸起）** / 商城 / 我的。
 * 脉诊居中：最高频动作放在拇指热区，且与商城拉开距离（医疗/商业分区，§1.3 原则 5）。
 *
 * 如产品最终选择需求原顺序（首页/脉诊/报告/商城/我的，§10 待确认 1），
 * 只需调整本文件中 Tabs.Screen 的顺序，组件不受影响。
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  const cartCount = useCartBadge();
  const deviceAlert = useDeviceAlert();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={({ state, navigation }) => (
        <TabBarContainer>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            const config = TAB_CONFIG[route.name];
            if (!config) return null;

            // 中央脉诊按钮：56pt 圆形，上浮 16pt + 品牌光晕（§7.1）
            if (config.center) {
              return (
                <View
                  key={route.key}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View
                    accessibilityLabel="脉诊"
                    accessibilityRole="button"
                    accessibilityState={{ selected: focused }}
                    onTouchEnd={onPress}
                    style={[
                      {
                        position: 'absolute',
                        bottom: CENTER_BUTTON_LIFT,
                        width: CENTER_BUTTON_SIZE,
                        height: CENTER_BUTTON_SIZE,
                        borderRadius: radius.full,
                        backgroundColor: colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      shadow('glowPrimary'),
                    ]}
                  >
                    <Icon color={colors.textOnAccent} icon={Activity} size={26} />
                  </View>
                </View>
              );
            }

            return (
              <View key={route.key} onTouchEnd={onPress} style={{ flex: 1 }}>
                <TabBarItem
                  badge={config.showCartBadge ? cartCount : undefined}
                  dot={config.showDeviceAlert ? deviceAlert : undefined}
                  focused={focused}
                  icon={
                    <Icon
                      color={focused ? colors.accent : colors.textTertiary}
                      icon={config.icon}
                      size={24}
                    />
                  }
                  label={config.label}
                />
              </View>
            );
          })}
        </TabBarContainer>
      )}
    >
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="report" options={{ title: '报告' }} />
      <Tabs.Screen name="pulse" options={{ title: '脉诊' }} />
      <Tabs.Screen name="mall" options={{ title: '商城' }} />
      <Tabs.Screen name="me" options={{ title: '我的' }} />
    </Tabs>
  );
}

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof House;
    center?: boolean;
    showCartBadge?: boolean;
    showDeviceAlert?: boolean;
  }
> = {
  index: { label: '首页', icon: House },
  report: { label: '报告', icon: FileText },
  pulse: { label: '脉诊', icon: Activity, center: true },
  // 购物车角标显示在「商城」Tab（§2.1）
  mall: { label: '商城', icon: ShoppingBag, showCartBadge: true },
  // 设备异常（低电量/未连接）以小红点显示在「我的」Tab（§2.1）
  me: { label: '我的', icon: User, showDeviceAlert: true },
};

export { TAB_BAR_HEIGHT };
