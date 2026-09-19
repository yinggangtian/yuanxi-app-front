import { render } from '@testing-library/react-native';

import { Badge } from '../Badge';

// RNTL v14 的 render 为异步，需 await 后才能拿到查询方法。
describe('Badge（§6.10）', () => {
  it('显示数字', async () => {
    const { getByText } = await render(<Badge count={3} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('超过上限显示 99+', async () => {
    const { getByText } = await render(<Badge count={120} />);
    expect(getByText('99+')).toBeTruthy();
  });

  it('count 为 0 时不渲染，避免出现「0」角标', async () => {
    const { queryByTestId } = await render(<Badge count={0} testID="badge" />);
    expect(queryByTestId('badge')).toBeNull();
  });

  it('不传 count 时渲染小红点', async () => {
    const { getByTestId, getByLabelText } = await render(<Badge testID="dot" />);
    expect(getByTestId('dot')).toBeTruthy();
    expect(getByLabelText('有新内容')).toBeTruthy();
  });
});
