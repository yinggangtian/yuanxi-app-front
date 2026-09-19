import { REPORT_DISCLAIMER } from '../../../api/schemas/report';
import { t } from '../index';

/**
 * 合规文案在代码中只应有一个权威来源。
 * 本测试防止 schema 与 i18n 两处文案漂移（§8：口径必须一致）。
 */
describe('合规文案一致性（§8）', () => {
  it('报告免责声明与 i18n 保持同源', () => {
    expect(t().compliance.reportDisclaimer).toBe(REPORT_DISCLAIMER);
  });

  it('免责声明包含「不能替代医生诊断」这一必要表述', () => {
    expect(REPORT_DISCLAIMER).toContain('不能替代医生诊断');
  });

  it('健康数据同意文案明确列出所处理的数据类型', () => {
    const text = t().compliance.healthDataConsent;
    expect(text).toContain('脉搏信号');
    expect(text).toContain('体质');
  });

  it('注销说明同时告知删除范围与依法保留的部分', () => {
    const text = t().compliance.accountDeletion;
    expect(text).toContain('无法恢复');
    expect(text).toContain('依法保留');
  });
});
