# 元息 App 前端 (yuanxi-app-front)

「脉搏环」硬件配套客户端 —— iOS + Android。

实现依据：《元息 App 前端详细设计文档 v0.1》（`docs/design.md`）。

## 仓库结构

```text
apps/mobile/     # Expo (React Native) 客户端
docs/            # 设计文档
```

## 技术栈

| 层 | 选择 |
|---|---|
| Language | TypeScript (strict) |
| Framework | React Native 0.86 (New Architecture + Hermes) |
| Tooling | Expo SDK 57 + Dev Client（不使用 Expo Go） |
| Routing | Expo Router |
| Styling | NativeWind 4 + Yuanxi Design System |
| Server State | TanStack Query v5（持久化到 MMKV） |
| Client State | Zustand |
| 动画 / 手势 | Reanimated 4 + Gesture Handler |
| 2D 图形 | React Native Skia |
| BLE | 自建 `BleService` 接口（Mock / ble-plx 两套实现） |
| 测试 | Jest + RNTL |

## 快速开始

```bash
cd apps/mobile
npm install
npm run start        # 启动 Dev Client 打包器
npm run typecheck    # TypeScript 检查
npm run lint         # ESLint（含分层依赖边界校验）
npm test             # Jest 单测
```

> 需要原生能力（BLE / 微信支付），因此 **不能使用 Expo Go**，请先用
> `npx expo run:ios` / `npx expo run:android` 或 EAS Build 构建 Dev Client。

## 开发约定

- `app/` 只做路由与页面装配，业务逻辑放 `src/features/`。
- `src/ui/` 为无业务依赖的设计系统；禁止反向依赖 `features/` 或 `api/`。
- feature 之间只能通过对方的 `index.ts` 通信（由 ESLint 强制）。
- 高频数据（>10Hz）不进 React state / Zustand，只走 SharedValue / RingBuffer。

详见 `docs/design.md` §5.2 与 `apps/mobile/eslint.config.js`。
