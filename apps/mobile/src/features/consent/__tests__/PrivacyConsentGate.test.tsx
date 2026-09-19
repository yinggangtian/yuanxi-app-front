import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useAppStore } from '../../../stores/appStore';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { PrivacyConsentGate } from '../PrivacyConsentGate';

/**
 * §8 合规：同意隐私协议前不得渲染任何业务内容、不得收集信息、
 * 不得初始化三方 SDK。本测试锁住这一行为，防止后续改动意外放行。
 */
describe('PrivacyConsentGate（§8）', () => {
  beforeEach(() => {
    useAppStore.setState({
      privacyConsent: false,
      healthDataConsent: false,
      onboardingDone: false,
    });
  });

  const Child = () => <Text>业务内容</Text>;

  it('未同意时不渲染任何业务内容', async () => {
    const { queryByText, getByTestId } = await renderWithProviders(
      <PrivacyConsentGate>
        <Child />
      </PrivacyConsentGate>,
    );

    expect(queryByText('业务内容')).toBeNull();
    expect(getByTestId('privacy-consent-gate')).toBeTruthy();
  });

  it('两项均未勾选时「同意并继续」不可用', async () => {
    const { getByTestId, queryByText } = await renderWithProviders(
      <PrivacyConsentGate>
        <Child />
      </PrivacyConsentGate>,
    );

    await fireEvent.press(getByTestId('privacy-accept'));

    expect(useAppStore.getState().privacyConsent).toBe(false);
    expect(queryByText('业务内容')).toBeNull();
  });

  it('只勾选总协议、未单独同意健康数据时仍不可继续', async () => {
    const { getByTestId, getByLabelText } = await renderWithProviders(
      <PrivacyConsentGate>
        <Child />
      </PrivacyConsentGate>,
    );

    await fireEvent.press(getByLabelText('我已阅读并同意《用户协议》与《隐私政策》'));
    await fireEvent.press(getByTestId('privacy-accept'));

    expect(useAppStore.getState().privacyConsent).toBe(false);
  });

  it('两项都同意后才放行，并分别记录总协议与健康数据的同意', async () => {
    const { getByTestId, getByLabelText } = await renderWithProviders(
      <PrivacyConsentGate>
        <Child />
      </PrivacyConsentGate>,
    );

    await fireEvent.press(getByLabelText('我已阅读并同意《用户协议》与《隐私政策》'));
    await fireEvent.press(
      getByLabelText(
        '我同意元息处理我的健康数据（脉搏信号、脉象与体质分析结果），用于生成健康报告',
      ),
    );
    await fireEvent.press(getByTestId('privacy-accept'));

    const state = useAppStore.getState();
    expect(state.privacyConsent).toBe(true);
    // 健康数据属敏感个人信息，需单独记录同意（§8）
    expect(state.healthDataConsent).toBe(true);
  });

  it('已同意时直接渲染业务内容', async () => {
    useAppStore.setState({ privacyConsent: true, healthDataConsent: true });

    const { getByText } = await renderWithProviders(
      <PrivacyConsentGate>
        <Child />
      </PrivacyConsentGate>,
    );

    expect(getByText('业务内容')).toBeTruthy();
  });
});
