import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button（§6.10）', () => {
  it('渲染文案并响应点击', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<Button label="开始测量" onPress={onPress} />);

    await fireEvent.press(getByLabelText('开始测量'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 时不触发点击', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<Button disabled label="开始测量" onPress={onPress} />);

    await fireEvent.press(getByLabelText('开始测量'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading 时不触发点击，并标记 busy 状态', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<Button label="提交订单" loading onPress={onPress} />);

    const button = getByLabelText('提交订单');
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
  });

  it('loading 时隐藏文案，避免与 spinner 重叠', async () => {
    const { queryByText } = await render(<Button label="提交订单" loading />);
    expect(queryByText('提交订单')).toBeNull();
  });
});
