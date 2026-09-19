# Maestro E2E

对应设计文档 §5.12：P0 链路全覆盖。

全部流程跑在 **MockBleService** 之上（`src/features/measurement/hooks/useBleService.ts`
默认注入），因此无需真实硬件即可在 CI 与模拟器中回归。

## 运行

```bash
# 安装 Maestro：https://maestro.mobile.dev
maestro test e2e/flows
```

## 流程清单

| 文件 | 覆盖链路 | 对应文档 |
|---|---|---|
| `01-privacy-and-login.yaml` | 隐私协议双勾选 → 登录 | §8 / §4.7 |
| `02-bind-device.yaml` | 扫描 → 发现 → 确认绑定 → 佩戴教学 | §4.4 |
| `03-measure-to-report.yaml` | 预检 → 测量 → 分析 → 报告详情 | §4.2 / §4.3 |
| `04-mall-to-payment.yaml` | 商城 → 商品 → 加购 → 结算 → 支付 → 支付结果 | §4.5 |

## 约定

- 元素定位优先使用 `testID`（已在关键按钮上声明），避免依赖会变动的文案。
- 测量链路耗时较长，使用 `extendedWaitUntil` 而非固定 sleep。
