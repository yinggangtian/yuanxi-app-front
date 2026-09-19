# 元息 App 前端 (yuanxi-app-front)

「脉搏环」硬件配套客户端 —— iOS + Android。

实现依据：《元息 App 前端详细设计文档 v0.1》（[`docs/design.md`](docs/design.md)）。
本 README 中的 `§x.y` 均指向该文档章节。

## 仓库结构

```text
apps/mobile/          # Expo (React Native) 客户端
├── app/              # 路由与页面装配（34 个页面，对应 §2.3 路由表）
├── src/
│   ├── ui/           # Yuanxi Design System（tokens / primitives / components / charts）
│   ├── features/     # 业务域：bluetooth / measurement / device / report / mall / cart / order / profile / consent
│   ├── api/          # http client、query keys、Zod 契约
│   ├── stores/       # 跨 feature 的全局 Zustand store
│   ├── lib/          # storage / logger / format / i18n / queryClient
│   ├── mocks/        # 演示数据（驱动全部页面与 E2E）
│   └── test/         # 测试渲染入口
├── e2e/flows/        # Maestro P0 链路
└── eas.json          # development / preview / production 三套 profile
docs/design.md        # 设计文档
```

## 技术栈（§5.1）

| 层 | 选择 |
|---|---|
| Language | TypeScript（strict + noUncheckedIndexedAccess） |
| Framework | React Native 0.86（New Architecture + Hermes） |
| Tooling | Expo SDK 57 + Dev Client（**不使用 Expo Go**） |
| Routing | Expo Router（typedRoutes） |
| Styling | NativeWind 4 + Yuanxi Design System |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| 本地 KV / 凭证 | react-native-mmkv v4 / expo-secure-store |
| Forms | React Hook Form + Zod 4 |
| 动画 / 手势 | Reanimated 4 + Gesture Handler |
| 2D 图形 | React Native Skia |
| BLE | 自建 `BleService` 接口（Mock / ble-plx 两套实现可切换） |
| 测试 | Jest + RNTL + Maestro |

## 快速开始

```bash
cd apps/mobile
npm install

npm run typecheck    # TypeScript
npm run lint         # ESLint（含 §5.2 分层依赖边界校验）
npm test             # Jest 单元 + 组件测试

npm run start        # 启动 Dev Client 打包器
npm run ios          # 或 npm run android（首次需构建原生工程）
```

> 需要 BLE 与微信支付等原生能力，**不能使用 Expo Go**。
> 请先 `npx expo run:ios` / `npx expo run:android` 或用 EAS 构建 Dev Client。

无硬件时：`BleService` 默认注入 `MockBleService`，
会合成带重搏波的脉搏信号，**登录 → 绑定 → 佩戴 → 测量 → 报告** 全链路可跑。

## 开发约定

### 分层依赖（§5.2，由 ESLint 强制）

```text
app/  ──►  features/  ──►  ui/ , api/ , lib/
features/A  ✗──►  features/B/内部文件   （只能经 features/B/index.ts）
ui/  ✗──►  features/ , api/
```

违反时 `npm run lint` 直接报错，并给出对应的文档章节说明。

### 性能红线（§5.4 / §5.6）

- **高频数据（>10Hz）永远不进 React state / Zustand**。
  实时波形走 `RingBuffer → SharedValue → Skia worklet`，JS 线程不参与每帧绘制。
- `WaveformCanvas` 只接收 `SharedValue`，不接收数组 props。
- JS ↔ UI 线程通信频率 ≤25Hz；质量分与脉率以 1Hz 更新。

### 设计系统（§6）

- 组件只引用**语义 token**（`bg` / `surface` / `text-primary` / `accent` …），
  不直接引用色阶，深色模式才能自动适配。
- `className` 只用于布局；颜色、字号、圆角通过设计系统组件的 props 表达。
- 状态一律「**颜色 + 图标 + 文字**」三重表达，不靠颜色单独传达（§1.3 原则 2）。

### 合规红线（§8）

以下几处改动前请先阅读文档对应章节：

| 位置 | 约束 |
|---|---|
| `features/consent/PrivacyConsentGate.tsx` | 同意前不渲染业务内容、不初始化任何三方 SDK；健康数据需**单独同意** |
| `app/pay/[orderId].tsx` | 只做元息自有确认卡片，**严禁仿制微信收银台/密码界面**（封号 + 下架风险） |
| `api/schemas/report.ts` · `lib/i18n` | 报告免责声明集中管理，两处同源（有测试保证一致） |
| `lib/logger.ts` | 日志中不得打印原始健康数据（敏感个人信息） |
| `app/(auth)/login.tsx` | iOS 提供第三方登录时必须同时提供 Apple 登录（App Store 4.8） |

## 测试策略（§5.12）

| 层 | 范围 | 现状 |
|---|---|---|
| Unit | 协议解析 / CRC / RingBuffer / 信号质量 / 状态机 / 购物车金额 | 196 个用例；`domain/` 99.3%、`engine/` 96.4%，均高于 90% 门槛 |
| Component | 设计系统组件、隐私门禁 | RNTL |
| E2E | 登录→绑定→佩戴→测量→报告；加购→结算→支付 | Maestro（见 `e2e/README.md`） |

> RNTL v14 的 `render` 与 `fireEvent` **均为异步**，编写测试时必须 `await`。

## 与设计文档的差异说明

| 项 | 说明 |
|---|---|
| TabBar 顺序 | 采用文档推荐的「脉诊居中凸起」（§10 待确认 1）。改序只需调整 `app/(tabs)/_layout.tsx` |
| 订单状态 | 已采纳文档建议补入「待收货」（§10 待确认 10） |
| BLE 协议 | 帧结构与 CRC 变体按文档示例实现，待硬件组文档确认（§10 待确认 2）。调整只需改 `features/bluetooth/domain/` |
| 测量阶段 | 校准/浮取/中取/沉取/分析，合计 75s。阶段表可整体替换（§10 待确认 3） |
| 信号质量 | 当前为 App 端实现（幅度 / 信噪比 / 基线漂移）。若改由设备端下发分数，保留 `gradeFromScore` 与 `describeQuality` 即可（§10 待确认 4） |
| 3D 设备渲染 | 按 §5.9 V1 方案：呼吸浮动 + Skia 柔光投影。序列帧资产待设计产出后替换 |
| 微信 SDK / 真实 BLE | 需自建 Expo Module（§5.7），本仓库提供接口与 Mock 实现，原生模块待接入 |
