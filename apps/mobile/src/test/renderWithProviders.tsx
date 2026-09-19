import { render as rntlRender } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

/**
 * 组件测试的统一渲染入口。
 *
 * 提供 SafeAreaProvider 的固定 metrics —— 否则依赖 useSafeAreaInsets
 * 的组件会在测试环境抛错（没有真实窗口可测量）。
 *
 * 注意：RNTL v14 的 render 与 fireEvent 均为异步，调用处必须 await。
 */
const TEST_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function renderWithProviders(ui: React.ReactElement) {
  return rntlRender(<SafeAreaProvider initialMetrics={TEST_METRICS}>{ui}</SafeAreaProvider>);
}

export { TEST_METRICS };
