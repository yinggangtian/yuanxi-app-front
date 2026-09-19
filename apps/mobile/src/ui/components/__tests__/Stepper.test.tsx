import { fireEvent, render } from '@testing-library/react-native';

import { Stepper } from '../Stepper';

/**
 * 注：RNTL v14 的 render 与 fireEvent 均为异步，必须 await —— 
 * 未 await 的 fireEvent Promise 会在下一个用例执行期间解析并卸载组件树，
 * 表现为「后续用例找不到元素」。
 */
const hidden = { includeHiddenElements: true } as const;

describe('Stepper（§4.5.3 数量受库存与限购约束）', () => {
  it('增减触发回调', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(<Stepper max={5} onChange={onChange} value={2} />);

    await fireEvent.press(getByLabelText('增加数量'));
    expect(onChange).toHaveBeenCalledWith(3);

    await fireEvent.press(getByLabelText('减少数量'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('到达下限时减少按钮禁用', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(<Stepper min={1} onChange={onChange} value={1} />);

    const decrease = getByLabelText('减少数量', hidden);
    expect(decrease.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(decrease);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('到达上限时增加按钮禁用', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(<Stepper max={2} onChange={onChange} value={2} />);

    const increase = getByLabelText('增加数量', hidden);
    expect(increase.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(increase);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('整体禁用时两侧都不可点击', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <Stepper disabled max={9} onChange={onChange} value={3} />,
    );

    await fireEvent.press(getByLabelText('增加数量', hidden));
    await fireEvent.press(getByLabelText('减少数量', hidden));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('展示当前数量', async () => {
    const { getByLabelText } = await render(<Stepper max={9} onChange={jest.fn()} value={4} />);
    expect(getByLabelText('数量 4')).toBeTruthy();
  });
});
