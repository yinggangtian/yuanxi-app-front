# 元息 App 前端详细设计文档

> 版本：v0.1（草案） · 日期：2026-09-19 · 范围：iOS + Android 客户端前端（不含后端 / 数据库 / 云服务）
> 读者：产品、设计、前端、原生（iOS/Android）、测试

---

## 目录

1. [产品概述与设计原则](#1-产品概述与设计原则)
2. [信息架构与导航](#2-信息架构与导航)
3. [核心用户链路](#3-核心用户链路)
4. [功能需求拆分](#4-功能需求拆分)
5. [技术架构](#5-技术架构)
6. [Yuanxi Design System 设计系统规范](#6-yuanxi-design-system-设计系统规范)
7. [页面 UI 设计](#7-页面-ui-设计)
8. [合规与风险](#8-合规与风险)
9. [开发里程碑](#9-开发里程碑)
10. [待确认事项](#10-待确认事项)

---

## 1. 产品概述与设计原则

### 1.1 产品定位

元息 App 是「脉搏环」硬件的配套客户端，核心闭环：

```text
购买设备 ──► 绑定设备 ──► 正确佩戴 ──► 脉诊监测 ──► 健康报告 ──► 调理建议 ──► 复购 / 补剂
   ▲                                                                              │
   └──────────────────────────────  健康积分 / 勋章激励  ◄────────────────────────┘
```

### 1.2 四大功能域

| 域 | 页面 | 核心价值 |
|---|---|---|
| **设备域** | 开启蓝牙与搜索、发现与确认、佩戴教学、设备管理 | 把硬件"接进来"，降低首次使用门槛 |
| **监测域** | 首页、脉诊监测、健康报告、趋势 | 产品核心价值：测得准、看得懂 |
| **交易域** | 商城首页、商品详情、购物车、确认订单、支付、支付结果、我的订单 | 商业闭环 |
| **用户域** | 我的、体质档案、积分勋章、地址、发票售后、设置 | 留存与服务 |

### 1.3 设计原则（医疗科技极简）

1. **数据优先，装饰让位** —— 每个页面只有一个视觉焦点（评分、波形、主按钮），其他元素降级为灰阶。
2. **状态永远可见** —— 设备连接、信号质量、测量进度在任何时刻都必须一眼可读，不靠颜色单独表达（颜色 + 图标 + 文字）。
3. **可信感** —— 克制的配色、精确的数字（等宽数字）、明确的数据来源与免责声明，避免"保健品广告感"。
4. **呼吸感** —— 品牌名"息"对应慢节奏的呼吸动效（4s 周期），用于等待态和品牌时刻，而不是到处闪烁。
5. **医疗与商业分区** —— 监测/报告页不出现强促销元素；商品推荐只以"相关调理方案"的弱形式出现。

---

## 2. 信息架构与导航

### 2.1 底部 TabBar 定版（建议）

5 个 Tab，**脉诊居中凸起**作为主操作：

```text
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   首页   │   报告   │  ( 脉诊 ) │   商城   │   我的   │
│  home    │  report  │  pulse ◉ │  mall    │   me     │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

| 位置 | Tab | 路由 | 说明 |
|---|---|---|---|
| 1 | 首页 | `/(tabs)` | 今日状态、快捷入口 |
| 2 | 报告 | `/(tabs)/report` | 最近报告 + 历史 + 趋势 |
| 3 | **脉诊** | `/(tabs)/pulse` | 中央凸起按钮，测量准备态 |
| 4 | 商城 | `/(tabs)/mall` | 商城首页 |
| 5 | 我的 | `/(tabs)/me` | 个人中心 |

**为什么脉诊居中而不是放第 2 位**：脉诊是最高频、最核心的动作，居中凸起在拇指热区，且与商城拉开距离（医疗/商业分区）。
如坚持需求原顺序 `首页 / 脉诊 / 报告 / 商城 / 我的`，只需调整 `(tabs)/_layout.tsx` 中顺序，组件不受影响。

**TabBar 全局规则**

- 只有 5 个 Tab 根页面显示 TabBar；所有二级页面（`push` 进入）隐藏 TabBar。
- 脉诊**测量进行中**（`/measure/live`）为全屏模态，隐藏 TabBar 与返回手势，退出需二次确认。
- 购物车角标显示在「商城」Tab；设备异常（低电量/未连接）以小红点显示在「我的」Tab。
- 再次点击当前 Tab：滚动到顶部 + 刷新。

### 2.2 页面地图

```text
启动
├── 隐私协议弹窗（首次，同意前不初始化任何 SDK）
├── (auth) 登录
│   ├── 手机号 + 验证码 / 一键登录
│   ├── 微信登录
│   └── Apple 登录（iOS 必须，见 §8）
│
├── (onboarding) 首次引导（无绑定设备时）
│   ├── 开启蓝牙与搜索        /device/scan
│   ├── 手动添加              /device/manual
│   ├── 发现与确认设备         /device/confirm
│   ├── 正确佩戴教学           /device/wear-guide
│   └── 基础档案（性别/年龄）   /onboarding/profile
│
├── (tabs)
│   ├── 首页
│   ├── 报告 ──► 报告详情 /report/[id] ──► 趋势 /report/trend
│   ├── 脉诊 ──► 测量中 /measure/live（全屏）──► 报告详情
│   ├── 商城 ──► 商品详情 /product/[id] ──► 购物车 /cart ──► 确认订单 /checkout
│   │                                      ──► 支付确认 /pay/[orderId] ──► 支付结果 /pay/result
│   └── 我的
│       ├── 体质档案 /me/profile
│       ├── 设备管理 /device/[id] ──► 固件升级 / 重新校准 / 解绑
│       ├── 我的订单 /orders ──► 订单详情 /order/[id] ──► 物流 /order/[id]/logistics
│       ├── 地址管理 /address
│       ├── 发票与售后 /after-sales
│       ├── 健康积分 /me/points  · 勋章 /me/badges
│       └── 设置 /settings
```

### 2.3 路由表（Expo Router）

```text
app/
├── _layout.tsx                     # Providers: Query / Theme / GestureHandler / SafeArea / BLE
├── +not-found.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── bind-phone.tsx
├── (onboarding)/
│   ├── _layout.tsx
│   └── profile.tsx
├── (tabs)/
│   ├── _layout.tsx                 # 自定义 TabBar
│   ├── index.tsx                   # 首页
│   ├── report.tsx
│   ├── pulse.tsx
│   ├── mall.tsx
│   └── me.tsx
├── device/
│   ├── scan.tsx
│   ├── manual.tsx
│   ├── confirm.tsx
│   ├── wear-guide.tsx
│   └── [id]/
│       ├── index.tsx               # 设备管理
│       ├── firmware.tsx
│       └── calibrate.tsx
├── measure/
│   └── live.tsx                    # presentation: fullScreenModal
├── report/
│   ├── [id].tsx
│   └── trend.tsx
├── product/[id].tsx
├── cart.tsx
├── checkout.tsx
├── pay/
│   ├── [orderId].tsx               # presentation: formSheet
│   └── result.tsx
├── orders.tsx
├── order/[id]/
│   ├── index.tsx
│   └── logistics.tsx
├── address/
│   ├── index.tsx
│   └── edit.tsx
├── after-sales.tsx
├── me/
│   ├── profile.tsx
│   ├── points.tsx
│   └── badges.tsx
└── settings.tsx
```

**路由守卫**（在根 `_layout.tsx` 中用 `Stack.Protected` / redirect 实现）：

| 条件 | 行为 |
|---|---|
| 未同意隐私协议 | 仅展示协议页 |
| 未登录 | 重定向 `(auth)/login`；商城首页、商品详情允许游客浏览 |
| 已登录 & 无绑定设备 & 首次 | 进入 `device/scan`（可"稍后再说"跳过） |
| 已登录 & 档案未完善 | 首次测量前拦截到 `(onboarding)/profile` |

---

## 3. 核心用户链路

### 3.1 新用户首次使用（设备已在手）

```text
下载 → 隐私协议 → 登录 → 开启蓝牙与搜索 → 发现设备 → 确认绑定
     → 佩戴教学(3步) → 贴合度试测 → 完善档案 → 首次脉诊 → 首份报告 → 首页
```

目标：**从打开 App 到看到首份报告 ≤ 5 分钟**。

### 3.2 电商用户（尚无设备）

```text
商城首页 → 脉搏环 Pro 横幅 → 商品详情 → 加入购物车 → 结算 → 确认订单
       → 微信支付 → 支付成功（送积分 + 脉诊体验卡）→ "设备到货后，先看佩戴教学"
```

### 3.3 日常脉诊

```text
首页「开始今日脉诊」/ 点击中央脉诊 Tab
  → 准备态（自动回连设备，检查电量/佩戴）
  → 测量中（波形 + 信号质量 + 阶段进度，约 60–90s）
  → 分析中（呼吸动效）
  → 报告详情 → 获得积分 / 勋章进度
```

### 3.4 异常链路（必须设计）

| 场景 | 处理 |
|---|---|
| 蓝牙关闭 | 全屏引导卡片 + 「去开启」（iOS 跳系统设置，Android 调起系统开启弹窗） |
| 未授权蓝牙 / 定位（Android ≤11） | 解释用途 → 系统授权 → 拒绝后引导设置页 |
| 搜索 30s 无设备 | 提示"确认设备已开机并靠近手机"+ 手动添加 + 常见问题 |
| 测量中断开 | 波形冻结，自动重连 10s；失败则保存已采集片段，提示重测 |
| 信号质量持续差（>5s） | 暂停进度，玻璃卡片提示调整佩戴，恢复后继续 |
| 支付取消/失败 | 回到支付确认页，订单保持"待付款"，展示剩余支付时间 |
| 支付结果未知 | 以服务端订单状态为准，轮询 3 次后展示"支付确认中" |
| 断网 | 测量数据本地暂存，恢复网络后自动上传生成报告 |

---

## 4. 功能需求拆分

> 优先级：**P0** 首发必须 · **P1** 首发建议 · **P2** 后续迭代

### 4.1 首页（Tab 1）

| 功能 | 描述 | 优先级 |
|---|---|---|
| 问候与日期 | "早上好，{昵称}" + 节气（中医氛围点缀） | P1 |
| 设备状态胶囊 | 已连接 / 未连接 / 低电量，点击进入设备管理 | P0 |
| 今日脉诊主卡 | 未测：「开始今日脉诊」大按钮；已测：今日评分 + 脉象结论 + 查看报告 | P0 |
| 最近趋势迷你图 | 近 7 次评分 sparkline | P1 |
| 今日调理建议 | 1–3 条来自最近报告的建议（饮食/作息/穴位） | P1 |
| 健康任务 | 每日脉诊、连续打卡进度，关联积分 | P2 |
| 商城推荐 | 1 个弱化卡片（与体质相关），可关闭 | P2 |
| 无设备态 | 主卡替换为「绑定你的脉搏环」+ 「去商城了解」 | P0 |

### 4.2 脉诊监测

分为 **准备态（Tab 页）** 和 **测量中（全屏模态）** 两个页面。

#### 4.2.1 准备态 `/(tabs)/pulse`

| 功能 | 描述 | 优先级 |
|---|---|---|
| 设备自动回连 | 进入页面自动连接最近设备，展示连接动画 | P0 |
| 预检清单 | 已连接 ✓ / 电量 ≥20% ✓ / 佩戴贴合 ✓（试采 3s 信号质量） | P0 |
| 开始测量按钮 | 预检通过才可点击；不通过时展示原因与修复入口 | P0 |
| 测量说明 | "保持静坐、手腕放松、测量约 60 秒" | P0 |
| 上次结果 | 上次评分 + 时间 | P1 |
| 体验卡状态 | 如有专属脉诊体验卡，显示剩余次数 | P2 |

#### 4.2.2 测量中 `/measure/live`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **实时脉搏波形** | Skia 绘制，60fps 横向滚动，显示最近 5s 窗口，带网格与峰值标记 | P0 |
| 实时脉率 | 大号等宽数字，每秒更新 | P0 |
| **信号质量** | 三档（优/良/差）+ 0–100 分，颜色+图标+文字；差时给出具体原因（接触不良/运动干扰/过松） | P0 |
| **动态进度** | 环形进度 + 阶段文字：`校准 → 浮取 → 中取 → 沉取 → 分析`（阶段以硬件协议为准，见 §10） | P0 |
| **磨砂玻璃反馈卡** | 浮于波形之上：阶段提示、信号异常提醒、"做得很好，保持放松"等正向反馈 | P0 |
| 暂停/恢复 | 信号差自动暂停进度；用户不可手动暂停（保证数据连续） | P0 |
| 退出确认 | "退出将丢弃本次测量" 二次确认 | P0 |
| 屏幕常亮 | `expo-keep-awake` | P0 |
| 触感反馈 | 阶段切换轻触感、完成成功触感 | P1 |
| 分析中过渡 | 数据上传 + 生成报告，呼吸动效 + 分步文案 | P0 |
| 离线兜底 | 无网络时本地保存原始数据，稍后生成报告 | P1 |

**信号质量判定（前端展示逻辑，算法由算法组提供）**

| 等级 | 分数 | 颜色 token | 文案 | 进度行为 |
|---|---|---|---|---|
| 优 | 80–100 | `signal.good` | 信号良好 | 正常推进 |
| 良 | 50–79 | `signal.fair` | 信号一般，请保持静止 | 正常推进 |
| 差 | 0–49 | `signal.poor` | 接触不良，请调整佩戴 | 暂停推进，5s 后弹出佩戴提示 |

### 4.3 健康报告

#### 4.3.1 报告 Tab `/(tabs)/report`

| 功能 | 描述 | 优先级 |
|---|---|---|
| 最新报告摘要卡 | 评分 + 主体质 + 脉象结论 | P0 |
| 历史报告列表 | 按月分组，无限滚动 | P0 |
| 趋势入口 | 7 / 30 / 90 天评分与关键指标趋势 | P1 |

#### 4.3.2 报告详情 `/report/[id]`

| 模块 | 内容 | 优先级 |
|---|---|---|
| **综合健康评分** | 0–100 环形评分，等级文字（如"良好"），与上次对比 ±Δ | P0 |
| **体质归因** | 主体质 + 兼夹体质（九种体质：平和、气虚、阳虚、阴虚、痰湿、湿热、血瘀、气郁、特禀），各体质倾向百分比条形图，点击看释义 | P0 |
| **脉象结论** | 如"弦细脉"，附通俗解释 | P0 |
| **多维脉象指标** | 雷达图 + 指标列表：脉率、节律、脉位（浮/沉）、脉力（虚/实）、流利度（滑/涩）、紧张度（弦/紧）；每项显示数值、参考区间、状态标签 | P0 |
| 原始波形回放 | 本次测量的波形片段，可左右拖动 | P1 |
| **中医调理建议** | 分类卡片：饮食 / 作息 / 运动 / 穴位 / 情志；穴位带示意图 | P0 |
| **趋势** | 本次在近期趋势中的位置（迷你折线） | P1 |
| 相关调理方案 | 弱化商品卡（"可参考"），合规文案 | P2 |
| 分享报告 | 生成长图分享（隐去敏感信息） | P2 |
| 免责声明 | 固定在底部："本报告仅供健康参考，不能替代医生诊断" | P0 |

### 4.4 硬件连接与新手指引（Onboarding）

#### 4.4.1 开启蓝牙与搜索 `/device/scan`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **脉搏环 3D 悬浮渲染** | 设备主视觉悬浮 + 缓慢自转/上下浮动 + 底部柔光投影（实现方案见 §5.9） | P0 |
| 蓝牙状态检测 | 关闭 → 引导开启；未授权 → 权限说明 → 系统授权 | P0 |
| **动态雷达扫描** | 以设备为中心的同心圆扩散波纹（3 圈错峰，2.4s 周期） | P0 |
| 扫描提示文案 | "正在寻找附近的脉搏环…请将设备靠近手机并长按按键开机" | P0 |
| 发现列表 | 发现设备以卡片从底部弹出，按 RSSI 排序，多台时可选择 | P0 |
| **手动添加** | 扫描设备包装盒/机身二维码（`expo-camera`）或输入 SN | P1 |
| 超时处理 | 30s 未发现 → 帮助卡片 + 重新扫描 | P0 |
| 稍后再说 | 跳过绑定进入首页（首页展示无设备态） | P0 |

#### 4.4.2 发现与确认设备 `/device/confirm`

| 功能 | 描述 | 优先级 |
|---|---|---|
| 连接过程 | 连接中 → 读取设备信息 → 校验（进度 3 步） | P0 |
| **设备确认卡片** | 设备图、型号（脉搏环 Pro）、SN 后四位、固件版本 | P0 |
| **电量与信号展示** | 电量百分比 + 电池图标；信号强度 4 格（由 RSSI 映射） | P0 |
| 设备指示确认 | "设备指示灯正在闪烁，确认是你的设备吗？"（多设备场景防绑错） | P1 |
| **一键绑定** | 调用绑定 API，成功后展示成功动画 → 进入佩戴教学 | P0 |
| 已被他人绑定 | 提示并提供"申请解绑"说明 | P1 |

#### 4.4.3 正确佩戴教学 `/device/wear-guide`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **佩戴位置示意图** | 手腕插画：标注腕骨（尺骨茎突）上方两指宽位置，用两指示意 + 虚线定位 | P0 |
| **三大操作指引** | ① 位置：腕骨上方两指 ② 松紧：可轻松插入一指，不压出红痕 ③ 贴合：传感器面紧贴皮肤、朝向手腕内侧（以实际硬件为准） | P0 |
| 分步卡片 | 3 步横向翻页，每步插画 + 一句要点 + 常见错误对比（✓ / ✗） | P0 |
| **贴合度实时检测** | 最后一步实时读取信号质量，达到"良"以上才点亮「完成」 | P1 |
| 随时复看 | 我的 → 设备管理 → 佩戴教学；测量中信号差也可唤起 | P0 |

### 4.5 健康商城与交易闭环

#### 4.5.1 商城首页 `/(tabs)/mall`

| 功能 | 描述 | 优先级 |
|---|---|---|
| 搜索框 | 顶部搜索（P1 可只做入口） | P1 |
| **新品横幅** | 脉搏环 Pro 主推 Banner，支持多张轮播 | P0 |
| **品类金刚区** | 2×4 或 1×5 图标导航：智能设备、配件、养生茶饮、营养补剂、艾灸理疗、会员服务… | P0 |
| **推荐流** | 双列瀑布流：医疗级设备 / 补剂；支持"根据你的体质推荐"标签 | P0 |
| 购物车入口 | 右上角 + 悬浮角标 | P0 |

#### 4.5.2 商品详情 `/product/[id]`（需求补充，闭环必需）

主图轮播、价格、规格选择（SKU 弹层）、详情图文、资质/注册证展示、底部栏（客服 / 购物车 / 加入购物车 / 立即购买）。P0。

#### 4.5.3 购物车 `/cart`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **商品选择 / 全选** | 单选、全选、按店铺分组（单店可不分组） | P0 |
| **数量增减** | Stepper，受库存与限购约束；乐观更新，失败回滚 | P0 |
| **价格实时汇总** | 底部栏：已选 N 件、合计、优惠明细（展开） | P0 |
| **一键结算** | 生成预订单 → 确认订单页 | P0 |
| 左滑删除 / 批量管理 | 编辑模式批量删除、移入收藏 | P1 |
| 失效商品区 | 下架/无货灰显，一键清空 | P1 |

> 前端汇总金额只作展示，**最终金额以服务端预订单计算结果为准**。

#### 4.5.4 确认订单 `/checkout`（需求补充）

收货地址、商品清单、配送方式、优惠券/积分抵扣、发票、备注、应付金额，底部「提交订单」。P0。

#### 4.5.5 微信支付确认 `/pay/[orderId]`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **支付确认卡片** | 底部弹出 Sheet：金额（大号数字）、订单摘要、支付剩余时间倒计时 | P0 |
| 支付方式 | 微信支付（默认）；预留支付宝 | P0 |
| **商户 / 安全背书** | 商户主体名称、"支付由微信支付提供安全保障"、加密锁图标 | P0 |
| **确认支付** | 调起微信 App 完成支付 → 回到 App → 查询服务端订单状态 | P0 |
| 未安装微信 | 提示并提供其他方式 | P0 |

> ⚠️ **关于"拟真原生支付卡片"**：我们的 Sheet 是**元息自己的订单确认卡片**（视觉原生、克制），点击后必须拉起**真正的微信支付**完成付款。不要在 App 内仿制微信支付的密码/收银台界面——这会被微信商户平台和应用商店认定为仿冒，存在封号与下架风险。

#### 4.5.6 支付成功与健康激励 `/pay/result`

| 功能 | 描述 | 优先级 |
|---|---|---|
| 成功状态 | 对勾动画 + 实付金额 + 订单号 | P0 |
| **赠送健康积分** | "+200 健康积分" 数字滚动动画 | P0 |
| **专属脉诊体验卡** | 卡片翻转/展开动画，展示权益与有效期 | P1 |
| **引导佩戴教学** | 购买含设备时：主按钮「先看看怎么佩戴」→ 佩戴教学；否则「开始脉诊」 | P0 |
| 次要操作 | 查看订单 / 继续逛逛 | P0 |

#### 4.5.7 我的订单 `/orders`

| 功能 | 描述 | 优先级 |
|---|---|---|
| **状态 Tab** | 全部 / 待付款 / 待发货 / 待收货 / 已完成（建议补"待收货"，否则已发货订单无处归类） | P0 |
| 订单卡片 | 商品缩略、状态、金额、时间 | P0 |
| **快捷操作** | 待付款：付款、取消；待收货：查物流、确认收货；已完成：再次购买、申请售后 | P0 |
| 待付款倒计时 | 卡片内倒计时 | P1 |
| 订单详情 / 物流 | 物流时间轴 | P0 |

### 4.6 我的（Tab 5）

| 模块 | 功能 | 优先级 |
|---|---|---|
| **体质档案卡** | 头像、昵称、性别、年龄、中医体质标签（主 + 兼夹），编辑入口 | P0 |
| **设备管理卡** | 设备名、电量、连接状态、固件版本；入口：固件升级 / 重新校准 / 佩戴教学 / 解绑 | P0 |
| 固件升级 | 检查新版本 → BLE OTA（DFU）进度 → 完成重启；升级中禁止退出 | P1 |
| 重新校准 | 按设备协议的校准流程 | P1 |
| 解绑 | 二次确认（输入/长按确认），解绑后清理本地设备缓存 | P0 |
| **商城服务入口** | 我的订单（带各状态角标）、地址管理、发票与售后、客服 | P0 |
| **健康积分** | 积分余额、获取记录、积分用途（抵扣/兑换） | P1 |
| **勋章成长** | 等级进度条、已获/未获勋章墙（连续打卡 7/30/100 天、首次报告、体质改善等） | P1 |
| 设置 | 通知、单位、隐私、数据导出/删除账号、关于、退出登录 | P0 |

### 4.7 全局能力

| 能力 | 描述 | 优先级 |
|---|---|---|
| 登录 | 手机号验证码、运营商一键登录（P1）、微信登录、Apple 登录 | P0 |
| 隐私合规 | 首启协议弹窗、单独同意健康数据采集、权限用途说明 | P0 |
| 骨架屏 / 空态 / 错误态 / 断网态 | 所有列表与数据页统一组件 | P0 |
| 深色模式 | 跟随系统 | P1 |
| 推送 | 测量提醒、订单物流（国内 Android 需厂商通道，后续） | P2 |
| 埋点与崩溃 | 关键漏斗埋点 + 崩溃监控 | P0 |
| 版本更新 | 强更/提示更新；OTA 热更新（见 §5.10） | P1 |

---

## 5. 技术架构

### 5.1 技术栈（定版 + 补充）

沿用已确定的选型，下表中 **加粗** 的为本文档补充项。

| 层 | 选择 | 备注 |
|---|---|---|
| Language | TypeScript（strict） | |
| Framework | React Native（New Architecture + Hermes） | |
| Tooling | Expo SDK 57（RN 0.86）+ Dev Client | 不用 Expo Go；落地前以 npm 实际最新 patch 锁版本 |
| Routing | Expo Router | |
| Styling | NativeWind 4 + Yuanxi Design System | |
| Server State | TanStack Query v5 | **+ 持久化到 MMKV** |
| Client State | Zustand | |
| 本地 KV | react-native-mmkv v4 | |
| 敏感凭证 | expo-secure-store | |
| Forms | React Hook Form + Zod 4 | |
| 动画 / 手势 | Reanimated 4 + Gesture Handler | |
| 2D 图形 | React Native Skia | 波形、环形评分、雷达 |
| **图表** | **victory-native（XL，基于 Skia）** | 趋势折线、柱状；雷达图用 Skia 自绘 |
| **磨砂玻璃** | **expo-blur** | Android 低端机降级（§6.6） |
| **3D 设备渲染** | **V1：预渲染序列帧 / 视频；V2：@react-three/fiber/native** | 见 §5.9 |
| **动效资产** | **Lottie（lottie-react-native）** | 成功对勾、勋章获取等设计师产出的动画 |
| **列表** | **@shopify/flash-list** | 商品流、历史报告、订单 |
| **图片** | **expo-image** | 缓存、占位、渐显 |
| BLE | 自建 BleService；V1 底层 react-native-ble-plx | 协议/状态机自研 |
| **二维码** | **expo-camera** | 手动添加设备 |
| **微信 SDK** | **自建 Expo Module 封装 WechatOpenSDK（iOS/Android）** | 支付 + 登录；社区库维护风险高 |
| **触感** | **expo-haptics** | |
| **屏幕常亮** | **expo-keep-awake** | |
| **崩溃监控** | **@sentry/react-native**（或国内：友盟/Bugly） | |
| **i18n** | **i18next**（首发仅中文，但文案从第一天起集中管理） | |
| 测试 | Jest + RNTL + Maestro | |
| 构建发布 | EAS Build / Submit → 后续 Fastlane + 国内渠道 | |

### 5.2 目录结构

```text
apps/mobile/
├── app/                              # 仅路由与页面装配，不写业务逻辑
├── src/
│   ├── ui/                           # Yuanxi Design System（无业务依赖）
│   │   ├── tokens/                   # colors / typography / spacing / radius / motion
│   │   ├── primitives/               # Text, Box, Pressable, Icon
│   │   ├── components/               # Button, Card, GlassCard, Chip, Stepper, Sheet, TabBar...
│   │   └── charts/                   # ScoreRing, Radar, Sparkline, WaveformCanvas
│   ├── features/
│   │   ├── auth/
│   │   ├── bluetooth/                # BleService、状态机、协议解析
│   │   ├── device/                   # 绑定、设备管理、OTA、校准
│   │   ├── onboarding/               # 扫描页、确认页、佩戴教学
│   │   ├── measurement/              # 信号管线、测量流程、波形组件
│   │   ├── report/
│   │   ├── mall/
│   │   ├── cart/
│   │   ├── order/
│   │   ├── payment/
│   │   └── profile/                  # 我的、积分、勋章
│   ├── api/                          # http client、拦截器、query keys、Zod schema
│   ├── stores/                       # 跨 feature 的全局 Zustand store（session、app）
│   ├── lib/                          # storage、logger、analytics、i18n、permissions
│   └── native/                       # 本地 Expo Modules（ble-core、wechat）
├── modules/                          # Expo Modules 源码（Swift / Kotlin）
│   ├── yuanxi-ble/
│   └── yuanxi-wechat/
├── assets/
├── e2e/                              # Maestro flows
├── app.config.ts
└── eas.json
```

**单个 feature 内部约定**

```text
features/measurement/
├── api/          # useMeasurementUpload 等 query/mutation hooks
├── components/   # PulseWaveform, SignalQualityBadge, StageProgress, FeedbackGlassCard
├── engine/       # RingBuffer, SignalQuality, StageMachine（纯 TS，100% 单测）
├── hooks/        # useMeasurementSession, useRealtimeWaveform
├── store.ts      # 测量流程 Zustand store
├── types.ts
└── index.ts      # 对外只暴露这里
```

**依赖规则**（用 ESLint `import/no-restricted-paths` 强制）：

```text
app/  ──►  features/  ──►  ui/ , api/ , lib/
features/A  ✗──►  features/B/内部文件   （只能经 features/B/index.ts）
ui/  ✗──►  features/ , api/
```

### 5.3 分层与数据流

```text
┌────────────────────────── UI 层（app/ + components）──────────────────────────┐
│  页面只调用 hooks，不直接调 API / BLE                                           │
└──────────────┬──────────────────────────────┬─────────────────────────────────┘
               │                              │
     ┌─────────▼─────────┐          ┌─────────▼──────────┐
     │  TanStack Query   │          │      Zustand       │
     │  服务端状态        │          │  客户端/设备状态    │
     └─────────┬─────────┘          └─────────▲──────────┘
               │                              │ 状态事件
     ┌─────────▼─────────┐          ┌─────────┴──────────┐
     │   api/ (fetch +   │          │  BleService        │
     │   Zod 校验)        │          │  (TS 接口)          │
     └───────────────────┘          └─────────┬──────────┘
                                              │ JSI / Expo Module 事件
                                    ┌─────────▼──────────┐
                                    │ iOS CoreBluetooth  │
                                    │ Android GATT       │
                                    └────────────────────┘
```

### 5.4 状态边界

| 数据 | 归属 | 持久化 |
|---|---|---|
| 用户信息、档案 | Query `['me']` | Query persist（MMKV） |
| 设备列表 / 设备详情（服务端） | Query `['devices']` | Query persist |
| 报告列表 / 报告详情 | Query `['reports']` / `['report', id]` | Query persist（详情缓存最近 20 份） |
| 商品、购物车、订单 | Query `['products']` `['cart']` `['orders', status]` | 仅商品缓存 |
| 当前 BLE 连接状态、电量、RSSI | Zustand `useDeviceStore` | 仅 `lastDeviceId` 存 MMKV |
| 测量流程（阶段、质量分、计时） | Zustand `useMeasurementStore` | 否 |
| **实时波形样本** | **Reanimated SharedValue / RingBuffer，不进任何 store** | 否 |
| 未上传的测量原始数据 | 文件系统（expo-file-system）+ MMKV 索引 | 是 |
| access / refresh token | SecureStore | 是 |
| 主题、引导完成标记、隐私同意 | MMKV | 是 |

> 规则：**高频数据（>10Hz）永远不进 React state / Zustand**，否则整棵树重渲染。

### 5.5 BLE 层设计

#### 5.5.1 对外接口

```typescript
// src/features/bluetooth/api/BleService.ts
export type BleAdapterState = 'unknown' | 'poweredOff' | 'unauthorized' | 'unsupported' | 'poweredOn';

export interface DiscoveredDevice {
  id: string;            // iOS: UUID；Android: MAC
  name: string;
  rssi: number;
  sn?: string;           // 从广播 manufacturerData 解析
  model?: 'ring-pro' | 'ring';
}

export interface DeviceInfo {
  sn: string;
  model: string;
  firmware: string;
  battery: number;       // 0-100
}

export interface BleService {
  getAdapterState(): Promise<BleAdapterState>;
  onAdapterStateChange(cb: (s: BleAdapterState) => void): Unsubscribe;
  requestPermissions(): Promise<boolean>;

  scan(opts: { timeoutMs: number }, onFound: (d: DiscoveredDevice) => void): Unsubscribe;
  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  onConnectionChange(cb: (s: ConnectionState) => void): Unsubscribe;

  // 业务级命令，协议细节封装在 Protocol 内
  startMeasurement(cfg: MeasurementConfig): Promise<void>;
  stopMeasurement(): Promise<void>;
  onSamples(cb: (batch: SampleBatch) => void): Unsubscribe;  // 批量回调，见 5.6
  onBattery(cb: (level: number) => void): Unsubscribe;

  startOta(firmware: FirmwareFile, onProgress: (p: number) => void): Promise<void>;
}
```

业务层只依赖此接口；底层实现可在 `PlxBleService`（react-native-ble-plx）与 `NativeBleService`（自研 Expo Module）之间切换，另提供 `MockBleService` 供模拟器开发、UI 调试和 E2E。

#### 5.5.2 连接状态机

```text
            ┌────────────┐
            │    idle    │◄──────────────────────────────┐
            └─────┬──────┘                               │
          scan()  │                                      │ disconnect()
            ┌─────▼──────┐   found    ┌────────────┐     │
            │  scanning  ├───────────►│ discovered │     │
            └────────────┘            └─────┬──────┘     │
                                  connect() │            │
                                    ┌───────▼──────┐     │
                          ┌────────►│  connecting  │     │
                          │         └───────┬──────┘     │
                          │     GATT ready  │            │
                          │         ┌───────▼──────┐     │
                          │         │    ready     ├─────┤
                          │         └──┬────────▲──┘     │
                          │   start()  │        │ stop() │
                          │         ┌──▼────────┴──┐     │
                          │         │  measuring   │     │
                          │         └──────┬───────┘     │
                          │    link lost   │ (any state) │
                   retry  │         ┌──────▼───────┐     │
                 (1s,2s,4s)└─────────┤ reconnecting ├─────┘ 超过 3 次
                                    └──────────────┘
```

- 状态机用纯 TS 实现（可选 XState 或手写 reducer），**全部状态迁移有单测**。
- 重连采用指数退避，测量中断开时最多等待 10s。

#### 5.5.3 协议层

```text
features/bluetooth/domain/
├── Packet.ts        # 帧结构：Header | Cmd | Len | Payload | CRC16
├── Protocol.ts      # 命令编码 / 响应解码
├── crc.ts
└── __tests__/       # 用硬件组提供的真实抓包数据做 fixture
```

- 分包重组、CRC 校验、序号丢包检测都在此层完成。
- 协议文档与抓包样例由硬件组提供（见 §10）。

#### 5.5.4 权限

| 平台 | 权限 | 说明 |
|---|---|---|
| iOS | `NSBluetoothAlwaysUsageDescription` | 文案需说明用途（审核要求） |
| Android 12+ | `BLUETOOTH_SCAN`（`neverForLocation`）、`BLUETOOTH_CONNECT` | |
| Android ≤11 | `ACCESS_FINE_LOCATION` | 需同时开启系统定位 |
| 后台 | V1 不做后台测量；仅前台 | 降低审核与耗电风险 |

### 5.6 实时波形数据管线

```text
Native BLE 回调（~200Hz 采样，按硬件）
   │  原生侧每 40ms 合并为一批（约 8 个样本）→ 一次事件
   ▼
Protocol 解码（TS）→ Float32Array
   │
   ├──► SignalQuality 引擎（1s 滑窗）──► useMeasurementStore.quality（1Hz 更新）
   ├──► 峰值检测 → 实时脉率（1Hz 更新）
   ├──► RawRecorder → 本地文件（完整原始数据，用于上传）
   └──► RingBuffer（5s 窗口）──► SharedValue（~25Hz 批量写入）
                                       │
                                       ▼  UI 线程
                          Skia Canvas + useFrameCallback
                          （路径在 worklet 中生成，60fps 平移）
```

性能要点：

1. JS ↔ UI 线程通信频率控制在 ≤25Hz；绘制平滑靠 UI 线程插值与平移。
2. 路径点数上限：屏幕宽度 px 数（超出时降采样，取 min/max 保留峰值形态）。
3. 波形组件 `PulseWaveform` 只接收 `SharedValue`，不接收 props 数组。
4. 目标：中端 Android（如骁龙 7 系）测量页稳定 60fps，JS 线程占用 < 30%。

### 5.7 支付集成

```text
购物车 → POST 预订单 → 确认订单 → POST 创建订单 → /pay/[orderId]
     → 用户点「确认支付」→ POST 获取支付参数（服务端调用微信统一下单）
     → WechatModule.pay(params)  ──► 微信 App
     ◄── 回调 errCode（仅作 UI 提示，不作为支付结果）
     → 轮询 GET /orders/{id}/status（1s, 2s, 3s）
     → 已支付：/pay/result；未确认：展示"支付确认中"并在订单页更新
```

- 自建 `yuanxi-wechat` Expo Module：`registerApp`、`pay`、`login`、`isInstalled`。
- iOS 需配置 Universal Links + `LSApplicationQueriesSchemes`；Android 需 `WXPayEntryActivity`，通过 Expo Config Plugin 注入，保证 `prebuild` 可重复生成。

### 5.8 网络层

- `api/client.ts`：基于 `fetch` 封装，统一注入 token、处理 401 → refresh → 重放。
- 所有响应用 Zod 校验，校验失败上报 Sentry 并降级显示。
- Query Key 工厂集中管理：`queryKeys.report.detail(id)`。
- 默认策略：`staleTime` 列表 30s、详情 5min；报告详情不可变，`staleTime: Infinity`。

### 5.9 3D 脉搏环渲染方案

| 方案 | 效果 | 成本 | 建议 |
|---|---|---|---|
| A. 预渲染序列帧 / 透明视频（设计师 C4D/Blender 出图） | 最高保真，材质光影完美 | 低，包体 +1–3MB | **V1 采用** |
| B. 静态高清渲染图 + Reanimated 浮动 + Skia 投影/光晕 | 高，但无自转 | 最低 | 低端机降级 / 列表缩略 |
| C. glTF + @react-three/fiber/native（expo-gl） | 可交互旋转 | 高，冷启动与发热风险 | V2 视需求 |

V1 实现：透明背景 WebP/视频循环播放自转 + `translateY` 呼吸浮动（±6pt，4s）+ 底部 Skia 椭圆模糊投影随浮动缩放。

### 5.10 发布与 OTA

- EAS Build：`development`（Dev Client）/ `preview`（内测）/ `production` 三个 profile。
- OTA（EAS Update）：只用于 JS/资源修复；**国内访问需评估 CDN 速度**，必要时自建更新服务器（兼容 expo-updates 协议）。
- 国内 Android 渠道（华为、小米、OPPO、vivo、应用宝）：后续接 Fastlane / 渠道包脚本。

### 5.11 质量指标

| 指标 | 目标 |
|---|---|
| 冷启动（中端 Android） | < 2s 到首页骨架 |
| 测量页帧率 | ≥ 55fps（P95） |
| 从扫描到连接成功 | < 8s（P90） |
| 崩溃率 | < 0.2% |
| 列表滚动 | 无白屏，FlashList 预估尺寸准确 |

### 5.12 测试策略

| 层 | 工具 | 覆盖重点 | 目标 |
|---|---|---|---|
| Unit | Jest | 协议解析、CRC、RingBuffer、信号质量、状态机、购物车金额计算 | engine/domain ≥ 90% |
| Component | RNTL | 设计系统组件、购物车交互、报告模块渲染 | 关键组件全覆盖 |
| E2E | Maestro + MockBleService | 登录→绑定→佩戴→测量→报告；加购→结算→支付（沙箱） | P0 链路全覆盖 |
| 真机 | 设备矩阵 | iPhone（近 3 代）+ 华为/小米/OPPO/vivo 各 1 台中低端 | 每版本回归 BLE |

---

## 6. Yuanxi Design System 设计系统规范

### 6.1 风格定义：医疗科技极简

- **关键词**：洁净、精确、呼吸、可信、温和。
- **构成**：大量留白 + 冷调中性灰 + 单一品牌色「息青」+ 局部磨砂玻璃 + 细腻的柔光。
- **不要**：大面积渐变、霓虹科技蓝、多彩图标、密集促销色块、拟物中医元素（祥云、毛笔字）滥用。中医感仅通过**文案、节气、少量东方留白**传达。

### 6.2 色彩

#### 6.2.1 品牌色「息青」（Primary）

| Token | Light | 用途 |
|---|---|---|
| `primary-50` | `#EEF9F8` | 选中背景、浅色底 |
| `primary-100` | `#D3F0ED` | 标签底色 |
| `primary-200` | `#A6E0DA` | 进度轨道高亮 |
| `primary-300` | `#6FCBC2` | 波形辉光 |
| `primary-400` | `#36B3A8` | 图表主色 |
| `primary-500` | `#12998E` | **主色**：主按钮、选中 Tab、波形线 |
| `primary-600` | `#0B7F76` | 按下态、**品牌色文字**（白底对比度 ≥ 4.5） |
| `primary-700` | `#0A665F` | 深色强调 |
| `primary-900` | `#063C38` | 深色模式背景点缀 |

#### 6.2.2 中性色「墨」（Ink，冷调）

| Token | Light | 用途 |
|---|---|---|
| `ink-900` | `#0E1A22` | 主标题、主要数字 |
| `ink-700` | `#34434E` | 正文 |
| `ink-500` | `#6B7985` | 次要文字、说明 |
| `ink-400` | `#95A1AB` | 占位符、禁用文字 |
| `ink-300` | `#C4CCD3` | 描边、分割线（强） |
| `ink-200` | `#E1E6EA` | 分割线、禁用背景 |
| `ink-100` | `#EEF1F4` | 输入框背景、骨架屏 |
| `ink-50` | `#F5F7F9` | **页面背景** |
| `white` | `#FFFFFF` | 卡片背景 |

#### 6.2.3 语义色

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `success` | `#1E9E64` | `#3CC484` | 成功、指标正常 |
| `warning` | `#D98A1C` | `#F0A94A` | 注意、信号一般、低电量 |
| `danger` | `#D6453D` | `#F0685F` | 错误、信号差、指标异常 |
| `info` | `#2F7FD8` | `#5B9DEB` | 提示信息 |
| `price` | `#E14B35` | `#F26A55` | **仅**用于价格数字 |

#### 6.2.4 信号质量色

| Token | 值 | 配套图标 |
|---|---|---|
| `signal-good` | = `primary-500` | 满格信号 |
| `signal-fair` | = `warning` | 两格信号 |
| `signal-poor` | = `danger` | 一格 + 感叹号 |

#### 6.2.5 数据可视化色（体质 / 多维指标）

低饱和、同明度，区分度靠色相，且始终配合文字标签：

```text
viz-1 #12998E 息青   viz-2 #5B7FD6 雾蓝   viz-3 #C7894B 琥珀
viz-4 #8C6BC7 藕紫   viz-5 #D0677A 胭脂   viz-6 #6F9E4F 竹绿
```

#### 6.2.6 深色模式

| Token | Dark |
|---|---|
| `bg` | `#0A1217` |
| `surface` | `#121D24` |
| `surface-raised` | `#1A2730` |
| `ink-900 → text-primary` | `#EEF3F6` |
| `ink-500 → text-secondary` | `#8E9BA5` |
| `border` | `#24323C` |
| `primary-500` | `#2BB5A9`（提亮以保证对比） |

所有组件只使用**语义 token**（`bg` / `surface` / `text-primary` / `border` / `accent`），不直接引用色阶，以便自动适配深色模式。

### 6.3 字体排版

**字体**

| 用途 | iOS | Android |
|---|---|---|
| 中文 | PingFang SC（系统） | 系统默认（思源黑体 / 厂商字体） |
| 数字 / 英文 | **Inter**（OFL 开源，随包内置，仅数字与拉丁子集） | 同左 |

- 所有数值（评分、脉率、价格、电量、倒计时）使用 Inter + `fontVariant: ['tabular-nums']`，防止数字跳动时宽度抖动。

**字号阶梯**（单位 pt，行高 / 字重）

| Token | 字号 | 行高 | 字重 | 用途 |
|---|---|---|---|---|
| `display` | 56 | 60 | 600 (Inter) | 健康评分大数字 |
| `metric-lg` | 40 | 44 | 600 (Inter) | 实时脉率、支付金额 |
| `metric` | 24 | 28 | 600 (Inter) | 指标卡数值 |
| `title-1` | 26 | 34 | 600 | 页面大标题 |
| `title-2` | 20 | 28 | 600 | 模块标题 |
| `title-3` | 17 | 24 | 600 | 卡片标题 |
| `body` | 16 | 24 | 400 | 正文 |
| `body-sm` | 14 | 22 | 400 | 次要正文、列表说明 |
| `caption` | 12 | 18 | 400 | 辅助说明、单位 |
| `micro` | 10 | 14 | 500 | 图表坐标、角标（最小字号） |

- 字重只用 400 / 500 / 600，不用 700+（极简感来自克制）。
- 支持系统动态字体：`allowFontScaling` 开启，`maxFontSizeMultiplier = 1.3`；数据类大数字限制 1.1。

### 6.4 间距与栅格

- 基准单位 **4pt**：`0 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`。
- 页面左右边距：**20pt**。
- 卡片内边距：常规 16pt，主卡 20pt。
- 卡片之间：12pt；模块之间：24–32pt。
- 列表行高：≥ 56pt；可点击区域 ≥ 44×44pt。

### 6.5 圆角与投影

| Token | 值 | 用途 |
|---|---|---|
| `radius-xs` | 6 | 标签、角标 |
| `radius-sm` | 10 | 输入框、小按钮 |
| `radius-md` | 14 | 按钮、列表卡片 |
| `radius-lg` | 20 | 主卡片、玻璃卡片 |
| `radius-xl` | 28 | 底部 Sheet 顶角、大 Banner |
| `radius-full` | 9999 | 胶囊、头像、圆形按钮 |

投影（冷色、低不透明度，只用于浮起元素）：

| Token | iOS shadow | Android elevation | 用途 |
|---|---|---|---|
| `shadow-sm` | `0 1 3 rgba(14,26,34,0.06)` | 1 | 列表卡片 |
| `shadow-md` | `0 6 20 rgba(14,26,34,0.08)` | 4 | 主卡片、浮动按钮 |
| `shadow-lg` | `0 12 32 rgba(14,26,34,0.12)` | 8 | Sheet、弹窗 |
| `glow-primary` | `0 8 24 rgba(18,153,142,0.28)` | — | 脉诊主按钮、设备光晕 |

> 默认卡片**无投影**，仅用白色卡片与 `ink-50` 背景的明度差区分层级。

### 6.6 磨砂玻璃（Glass）规范

| 属性 | Light | Dark |
|---|---|---|
| 背景 | `rgba(255,255,255,0.60)` | `rgba(18,29,36,0.55)` |
| 模糊 | `intensity 40`（≈ blur 24px） | `intensity 40`，`tint="dark"` |
| 描边 | 1px `rgba(255,255,255,0.70)` | 1px `rgba(255,255,255,0.08)` |
| 圆角 | `radius-lg` 20 | 同左 |
| 内边距 | 16pt | 同左 |

**使用规则**

1. 只在**有内容/色彩的背景之上**使用（测量页波形之上、设备渲染之上、TabBar、支付 Sheet），纯色背景上用玻璃毫无意义。
2. 同一视区最多 **2 层**玻璃，禁止玻璃叠玻璃。
3. 玻璃上的文字必须使用 `ink-900` / `ink-700`，不使用灰度 < 500 的文字。
4. **Android 降级**：低端机（通过设备评级或 API < 31）改为 `rgba(255,255,255,0.92)` 不透明底，视觉层级不变。
5. 开启系统"降低透明度"时同样降级。

### 6.7 动效

| Token | 时长 | 曲线 | 用途 |
|---|---|---|---|
| `motion-fast` | 120ms | standard | 按压、切换 |
| `motion-base` | 220ms | standard | 展开、淡入 |
| `motion-slow` | 360ms | emphasized | 页面级、Sheet |
| `motion-breath` | 4000ms 循环 | sine in-out | 呼吸光晕、设备悬浮、分析中 |
| `motion-radar` | 2400ms 循环 | ease-out | 蓝牙雷达扩散 |
| `spring-default` | — | `damping 18, stiffness 180` | 卡片弹出、数字跳动 |

曲线：`standard = cubic-bezier(0.2, 0, 0, 1)`，`emphasized = cubic-bezier(0.3, 0, 0, 1)`。

- 开启系统"减弱动态效果"时：循环动画停止、转场改为淡入淡出。
- 数字变化（评分、积分、脉率）使用滚动计数动画，时长 ≤ 800ms。
- 触感：主按钮 `light`、阶段完成 `medium`、成功 `notificationSuccess`、错误 `notificationError`。

### 6.8 图标

- 线性图标，**1.5pt 描边**，24pt 网格，圆角端点；选中态为线性 + 品牌色填充。
- 推荐基础库：Lucide（MIT）作为通用图标；设备、脉诊、体质、穴位等业务图标由设计定制，统一描边规范。
- 金刚区图标：48pt 圆角容器（`primary-50` 底）+ 24pt 线性图标，不使用多色插画图标。

### 6.9 数据可视化规范

| 图表 | 规范 |
|---|---|
| **实时波形** | 背景 `ink-50` 或测量页深色渐变；网格线 0.5pt `ink-200`（5 条横线，1s 纵线）；波形线 2pt `primary-500` + 下方 `primary-300` 12% 渐隐填充；最新点带 6pt 发光圆点；信号差时线色切为 `signal-poor` 且透明度 60% |
| **评分环** | 270° 开口环，轨道 `ink-100` 12pt，进度 `primary-500` 圆头；中心 `display` 字号分数 + `caption` 等级 |
| **雷达图** | 6 轴，3 层参考环（`ink-200` 虚线），填充 `primary-500` 16% + 描边 2pt；轴标签 `caption` 字号，参考区间阴影 `ink-100` |
| **体质条形图** | 水平条，高 8pt 圆头，主体质 `primary-500`，其他 `ink-300`，右侧百分比等宽数字 |
| **趋势折线** | 1.5pt 线，数据点 4pt 仅在最新点和选中点显示；参考区间以 `primary-50` 色带显示；x 轴最多 6 个刻度 |
| **Sparkline** | 无坐标轴，1.5pt 线，末点圆点 |

### 6.10 组件清单

**基础组件（`ui/components`）**

| 组件 | 变体 / 规格 |
|---|---|
| `Text` | 对应字号 token：`display` … `micro`；`tone`: primary / secondary / tertiary / accent / danger |
| `Button` | `primary`（息青实底白字）/ `secondary`（`primary-50` 底品牌字）/ `ghost` / `danger`；尺寸 `lg` 52pt / `md` 44pt / `sm` 32pt；状态 loading / disabled |
| `IconButton` | 40pt 圆形，透明或 `ink-100` 底 |
| `Card` | `plain`（白底无投影）/ `raised`（shadow-md）/ `outline` |
| `GlassCard` | 见 §6.6，自动降级 |
| `ListItem` | 左图标 + 标题/副标题 + 右值/箭头，56pt |
| `Chip` / `Tag` | 体质标签（`primary-50` 底 + `primary-600` 字）、状态标签（语义色 10% 底） |
| `Badge` | 数字角标、小红点 |
| `Stepper` | 数量增减，32pt 高，边界禁用 |
| `Checkbox` | 圆形 22pt，选中为 `primary-500` 实心 + 白色对勾 |
| `SegmentedTabs` | 订单状态、趋势周期；下划线指示器（Reanimated 滑动） |
| `Sheet` | 底部弹层，`radius-xl` 顶角，支持拖拽关闭 |
| `Dialog` | 确认弹窗，主次按钮 |
| `Toast` | 顶部轻提示，2s |
| `Skeleton` | `ink-100` 底 + 微光扫过 |
| `EmptyState` / `ErrorState` | 线性插画 + 一句话 + 操作按钮 |
| `TabBar` | 见 §7.1 |
| `Input` / `FormField` | 与 React Hook Form 绑定，错误态 `danger` 描边 + 下方提示 |

**业务组件**

| 组件 | 所在 feature |
|---|---|
| `DeviceStatusPill`、`BatteryIndicator`、`SignalBars`、`DeviceHero3D`、`RadarScan` | device / onboarding |
| `PulseWaveform`、`SignalQualityBadge`、`StageProgressRing`、`FeedbackGlassCard`、`LiveBpm` | measurement |
| `ScoreRing`、`ConstitutionBars`、`PulseRadar`、`MetricRow`、`AdviceCard`、`TrendChart` | report |
| `ProductCard`、`CategoryGrid`、`HeroBanner`、`CartItem`、`PriceText`、`CheckoutBar` | mall / cart |
| `PaySheet`、`MerchantTrust`、`RewardCard`、`PointsCounter` | payment |
| `OrderCard`、`LogisticsTimeline` | order |
| `ProfileHeader`、`BadgeWall`、`LevelProgress` | profile |

### 6.11 Token 代码化

```typescript
// src/ui/tokens/colors.ts
export const palette = {
  primary: { 50: '#EEF9F8', 100: '#D3F0ED', 200: '#A6E0DA', 300: '#6FCBC2', 400: '#36B3A8',
             500: '#12998E', 600: '#0B7F76', 700: '#0A665F', 900: '#063C38' },
  ink:     { 50: '#F5F7F9', 100: '#EEF1F4', 200: '#E1E6EA', 300: '#C4CCD3', 400: '#95A1AB',
             500: '#6B7985', 700: '#34434E', 900: '#0E1A22' },
} as const;
```

```javascript
// tailwind.config.js（NativeWind 4）— 语义 token 通过 CSS 变量实现深浅色切换
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg:        'rgb(var(--c-bg) / <alpha-value>)',
        surface:   'rgb(var(--c-surface) / <alpha-value>)',
        'text-primary':   'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
        border:    'rgb(var(--c-border) / <alpha-value>)',
        accent:    'rgb(var(--c-accent) / <alpha-value>)',
        primary:   { 50: '#EEF9F8', 100: '#D3F0ED', 500: '#12998E', 600: '#0B7F76' },
        success: '#1E9E64', warning: '#D98A1C', danger: '#D6453D', price: '#E14B35',
      },
      borderRadius: { xs: '6px', sm: '10px', md: '14px', lg: '20px', xl: '28px' },
      fontFamily: { num: ['Inter-SemiBold'] },
    },
  },
};
```

```css
/* global.css */
:root {
  --c-bg: 245 247 249;  --c-surface: 255 255 255;
  --c-text-primary: 14 26 34;  --c-text-secondary: 107 121 133;
  --c-border: 225 230 234;  --c-accent: 18 153 142;
}
@media (prefers-color-scheme: dark) {
  :root {
    --c-bg: 10 18 23;  --c-surface: 18 29 36;
    --c-text-primary: 238 243 246;  --c-text-secondary: 142 155 165;
    --c-border: 36 50 60;  --c-accent: 43 181 169;
  }
}
```

> 约定：页面中 `className` 只允许用于**布局**（flex、gap、padding）；颜色、字号、圆角通过设计系统组件的 props 表达，避免 token 在业务代码中失控。

---

## 7. 页面 UI 设计

> 以下为低保真线框 + 布局规格，作为高保真设计稿的结构依据。画布基准 iPhone 390×844pt。

### 7.1 底部 TabBar

```text
┌──────────────────────────────────────────────────────┐  ← 1px border 顶线（ink-200 50%）
│                        ╭─────╮                        │     GlassCard 背景
│   ⌂       ▤          │  ∿  │        ◫        ○      │  ← 脉诊按钮 56pt 圆，primary-500
│  首页    报告        ╰─────╯       商城•3     我的   │     上浮 16pt + glow-primary
│                        脉诊                           │
└──────────────────────────────────────────────────────┘
   高度 56pt + 底部安全区；图标 24pt；文字 micro 10pt
   选中：primary-500 图标+文字；未选：ink-400
```

- 中央按钮在"测量中"时为波形图标脉动；设备未连接时显示小灰点。

### 7.2 首页

```text
┌──────────────────────────────────────┐
│ 早上好，林一                    🔔   │  title-1
│ 9月19日 · 白露后第12天               │  caption ink-500
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ● 脉搏环 Pro 已连接   🔋 82%   > │ │  DeviceStatusPill（胶囊，white）
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │  主卡 raised，radius-lg，padding 20
│ │  今日脉诊                          │ │  背景：极浅息青径向渐变
│ │                                  │ │
│ │        ╭─────────╮               │ │
│ │        │   86    │  ← ScoreRing  │ │  已测态
│ │        │  良好   │               │ │
│ │        ╰─────────╯               │ │
│ │  弦细脉 · 气郁倾向     较上次 +3  │ │
│ │  [       查看完整报告        ]    │ │  Button secondary
│ └──────────────────────────────────┘ │
│   （未测态：呼吸光晕 + 「开始今日脉诊」 primary lg）│
│                                      │
│ 近 7 次趋势                    全部 > │  title-3
│ ┌──────────────────────────────────┐ │
│ │  ⌒﹏⌒﹏／‾  sparkline      86     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 今日调理                              │
│ ┌────────────┐┌────────────┐┌─────── │  横滑 AdviceCard 160×120
│ │🍵 饮食      ││🧘 作息      ││📍 穴位 │
│ │少食生冷…    ││23点前入睡… ││太冲穴… │
│ └────────────┘└────────────┘└─────── │
│                                      │
│ 为你推荐（弱化，可关闭）          ×    │
└──────────────────────────────────────┘
```

### 7.3 脉诊 · 准备态

```text
┌──────────────────────────────────────┐
│ 脉诊                                  │
│                                      │
│          ╭───────────────╮           │
│          │   ◯ 设备渲染    │           │  DeviceHero（静态图 + 呼吸光晕）
│          ╰───────────────╯           │
│                                      │
│  测量前检查                           │
│  ✓ 设备已连接           脉搏环 Pro    │  ListItem，success 图标
│  ✓ 电量充足                   82%    │
│  ◌ 佩戴贴合检测中…                   │  检测中：旋转；失败：warning + 「查看佩戴教学」
│                                      │
│  请保持静坐，手腕放松，测量约 60 秒     │  body-sm ink-500
│                                      │
│  [          开始测量          ]       │  Button primary lg + glow
│  上次测量：昨天 08:12 · 83 分         │  caption
└──────────────────────────────────────┘
```

### 7.4 脉诊 · 测量中（全屏）

背景：自上而下 `#0E1A22 → #0A3A37` 深色渐变（沉浸、突出波形），状态栏浅色。

```text
┌──────────────────────────────────────┐
│ ×                          ▮▮▮ 信号优 │  SignalQualityBadge（玻璃胶囊）
│                                      │
│            ╭───────────╮             │
│          ╱   中取  3/5   ╲           │  StageProgressRing 200pt
│         │      72        │          │  metric-lg 实时脉率，白色
│         │    次/分       │          │
│          ╲    00:38    ╱           │  剩余时间 caption
│            ╰───────────╯             │
│  校准 ─ 浮取 ─ ●中取 ─ 沉取 ─ 分析    │  阶段步进条
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ┊    ┊    ┊    ┊    ┊            │ │  PulseWaveform 高 180pt
│ │ ╱╲_  ╱╲_  ╱╲_  ╱╲_  ╱╲●         │ │  网格白 8%，波形 primary-300 + 辉光
│ │ ┊    ┊    ┊    ┊    ┊            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ╭──────────────────────────────────╮ │  FeedbackGlassCard（玻璃，dark tint）
│ │ 🌿 做得很好，请保持手腕放松         │ │  文案随阶段/信号切换，淡入淡出
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```

**信号差时**：波形变暗、`signal-poor` 色；玻璃卡片变为警示态（左侧 `danger` 竖条）+ "传感器接触不良，请将设备向腕骨方向移动" + 「查看佩戴教学」文字按钮；进度环暂停并显示 ‖。

**分析中**：波形淡出，中央呼吸光圈（`motion-breath`），分步文案依次出现：「解析脉象特征 → 匹配体质模型 → 生成调理建议」。

### 7.5 健康报告详情

```text
┌──────────────────────────────────────┐
│ ←  健康报告              9月19日 08:12 │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │        ╭─────────╮               │ │  ScoreRing 180pt
│ │        │   86    │               │ │  display 56pt
│ │        │  良好   │    较上次 ↑3   │ │
│ │        ╰─────────╯               │ │
│ │  脉象：弦细脉                      │ │  title-3
│ │  脉来端直而细，多与情志不舒、       │ │  body-sm ink-500
│ │  气血偏弱相关                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 体质归因                          ⓘ   │
│ ┌──────────────────────────────────┐ │
│ │ 气郁质  ███████████░░░░   62%  主 │ │  ConstitutionBars
│ │ 气虚质  ██████░░░░░░░░░   38%     │ │
│ │ 平和质  ████░░░░░░░░░░░   27%     │ │
│ │ [气郁质] [兼 气虚质]               │ │  Chip
│ └──────────────────────────────────┘ │
│                                      │
│ 脉象指标                              │
│ ┌──────────────────────────────────┐ │
│ │            脉率                   │ │  PulseRadar 6 轴
│ │     紧张度 ╱‾‾╲ 节律              │ │
│ │     流利度 ╲__╱ 脉位              │ │
│ │            脉力                   │ │
│ ├──────────────────────────────────┤ │
│ │ 脉率    72 次/分   60–100  正常 ● │ │  MetricRow
│ │ 节律    齐                 正常 ● │ │
│ │ 脉位    偏沉                关注 ● │ │  warning 状态
│ │ 脉力    偏弱                关注 ● │ │
│ │ 流利度  一般                正常 ● │ │
│ │ 紧张度  偏高（弦）          关注 ● │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 调理建议                              │
│ [饮食] [作息] [运动] [穴位] [情志]     │  SegmentedTabs
│ ┌──────────────────────────────────┐ │
│ │ 📍 太冲穴                          │ │  AdviceCard + 穴位示意图
│ │ 位于足背，第一、二跖骨间…           │ │
│ │ 每日按揉 3 分钟，以酸胀为度         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 近期趋势                    30天 ▾ >  │  TrendChart 迷你
│ ┌──────────────────────────────────┐ │
│ │  ‾\_/‾‾\_/‾‾‾ ●                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 本报告基于脉搏信号分析，仅供健康参考，  │  caption ink-400
│ 不能替代医生诊断。                     │
└──────────────────────────────────────┘
```

### 7.6 开启蓝牙与搜索

```text
┌──────────────────────────────────────┐
│                           稍后再说    │
│                                      │
│        ·   ·  (  (  ◯  )  )  ·   ·   │  RadarScan：3 圈同心波纹
│              ╭───────────╮            │  primary-300 描边，错峰扩散淡出
│              │  ◯ 脉搏环  │ ↕ 浮动     │  DeviceHero3D（序列帧自转）
│              ╰───────────╯            │
│               ░░░░░░░░░               │  Skia 椭圆投影，随浮动缩放
│                                      │
│  正在寻找你的脉搏环…                   │  title-2
│  请将设备靠近手机，长按按键 3 秒开机    │  body-sm ink-500
│                                      │
│ ╭──────────────────────────────────╮ │  发现后从底部弹出（GlassCard）
│ │ ◯ 脉搏环 Pro · 8F2A      ▮▮▮▯  > │ │
│ ╰──────────────────────────────────╯ │
│                                      │
│    找不到设备？  扫码 / 输入 SN 添加    │  ghost 文字按钮
└──────────────────────────────────────┘
```

**蓝牙关闭态**：雷达停止、设备渲染灰度，玻璃卡片「请开启手机蓝牙」+ Button「去开启」。

### 7.7 发现与确认设备

```text
┌──────────────────────────────────────┐
│ ←                                    │
│                                      │
│  ✓ 已找到你的设备                     │  title-1，对勾 Lottie
│                                      │
│ ┌──────────────────────────────────┐ │  Card raised
│ │        ╭─────────╮               │ │
│ │        │ 设备渲染 │               │ │
│ │        ╰─────────╯               │ │
│ │  脉搏环 Pro                        │ │  title-2
│ │  SN ····8F2A  ·  固件 v1.2.0      │ │  caption
│ │ ──────────────────────────────── │ │
│ │  🔋 电量          ▮▮▮▮▯   82%     │ │  BatteryIndicator
│ │  📶 信号          ▮▮▮▯    良好    │ │  SignalBars
│ └──────────────────────────────────┘ │
│                                      │
│  设备指示灯正在闪烁，请确认是你的设备   │  body-sm ink-500
│                                      │
│  [          一键绑定          ]       │  Button primary lg
│           不是这台？重新搜索            │  ghost
└──────────────────────────────────────┘
```

### 7.8 正确佩戴教学

```text
┌──────────────────────────────────────┐
│ ←                         1 / 3      │
│                                      │
│ ┌──────────────────────────────────┐ │  插画区 280pt（线性插画，息青点缀）
│ │         手腕示意图                  │ │
│ │     ┆  ← 腕骨（尺骨茎突）           │ │
│ │     ┆  ☝☝ 两指宽                   │ │  两指示意 + 虚线定位
│ │   ══╪══  ← 脉搏环佩戴位置           │ │  primary-500 高亮
│ └──────────────────────────────────┘ │
│                                      │
│  佩戴在腕骨上方两指处                  │  title-1
│  将手指并拢放在腕骨上方，               │  body ink-700
│  脉搏环佩戴在两指上沿                  │
│                                      │
│  ┌──────────┐  ┌──────────┐          │  对比图：✓ 正确 / ✗ 过高·过低
│  │ ✓ 正确    │  │ ✗ 离腕骨太近 │          │
│  └──────────┘  └──────────┘          │
│                                      │
│   ●  ○  ○                            │  分页指示
│  [           下一步           ]       │
└──────────────────────────────────────┘

第 2 步：松紧适中 —— 可轻松插入一指，佩戴后不压出红痕
第 3 步：传感器贴合 —— 传感器面紧贴皮肤（朝向以硬件为准）
          └─ 底部实时贴合检测：SignalQualityBadge「检测中… → 贴合良好 ✓」
             达到"良"以上，「完成」按钮点亮
```

### 7.9 健康商城首页

```text
┌──────────────────────────────────────┐
│ 商城                    🔍      🛒•3 │
│                                      │
│ ┌──────────────────────────────────┐ │  HeroBanner radius-xl，高 180
│ │ NEW                               │ │  浅息青渐变底 + 设备渲染右侧
│ │ 脉搏环 Pro                  ◯     │ │  title-1
│ │ 更精准的每一次脉诊                  │ │
│ │ [ 立即了解 ]                  • ○ ○│ │
│ └──────────────────────────────────┘ │
│                                      │
│  ◎      ◎      ◎      ◎      ◎      │  CategoryGrid 金刚区
│ 智能设备 配件  养生茶饮 营养补剂 更多   │  48pt 容器 primary-50 + 线性图标
│                                      │
│ 为你推荐  · 基于你的气郁体质           │  title-3 + Chip
│ ┌───────────────┐ ┌───────────────┐ │  双列瀑布流 ProductCard
│ │   商品图        │ │   商品图        │ │  radius-md，白底
│ │               │ │               │ │
│ │ 脉搏环 Pro     │ │ 玫瑰花茶        │ │  body-sm 两行截断
│ │ [医疗级]        │ │ [疏肝理气]      │ │  Tag
│ │ ¥1,299   ⊕    │ │ ¥68      ⊕    │ │  PriceText price 色 + 加购按钮
│ └───────────────┘ └───────────────┘ │
└──────────────────────────────────────┘
```

### 7.10 购物车

```text
┌──────────────────────────────────────┐
│ ←  购物车 (3)                  管理   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ◉ ┌────┐ 脉搏环 Pro               │ │  CartItem，左滑删除
│ │   │ 图 │ 星空灰 · 标准版      ▾    │ │  规格可点重选
│ │   └────┘ ¥1,299      [－ 1 ＋]    │ │  Stepper
│ ├──────────────────────────────────┤ │
│ │ ◉ ┌────┐ 玫瑰花茶                  │ │
│ │   │ 图 │ 100g                     │ │
│ │   └────┘ ¥68         [－ 2 ＋]    │ │
│ ├──────────────────────────────────┤ │
│ │ ○ ┌────┐ 艾草贴（已失效）           │ │  灰显
│ └──────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤  CheckoutBar（固定底部，白底 + 顶部分割线）
│ ◉ 全选   合计 ¥1,435    [ 结算(3) ]  │  合计 metric 等宽 + price 色
│          已优惠 ¥0  明细 ▴            │  caption
└──────────────────────────────────────┘
```

### 7.11 微信支付确认（Sheet）

```text
┌──────────────────────────────────────┐
│                                      │  背景：确认订单页 + 40% 黑遮罩
│╭────────────────────────────────────╮│  Sheet radius-xl，GlassCard 强度高
││               ────                  ││  拖拽把手
││  确认支付                        ×  ││
││                                    ││
││             ¥ 1,435.00             ││  metric-lg，ink-900（非红色，更可信）
││         支付剩余时间 14:52          ││  caption warning
││                                    ││
││  订单    脉搏环 Pro 等 3 件         ││  ListItem
││  商户    元息健康科技（XX）有限公司   ││  MerchantTrust
││                                    ││
││  ┌──────────────────────────────┐  ││
││  │ ◉ 💬 微信支付            推荐 │  ││  支付方式单选
││  └──────────────────────────────┘  ││
││                                    ││
││  🔒 支付由微信支付提供安全保障        ││  caption ink-500
││                                    ││
││  [        确认支付 ¥1,435        ]  ││  Button primary lg（品牌色，而非微信绿）
│╰────────────────────────────────────╯│
└──────────────────────────────────────┘
```

### 7.12 支付成功与健康激励

```text
┌──────────────────────────────────────┐
│                                   ×  │
│               ╭───╮                  │
│               │ ✓ │                  │  Lottie 对勾，primary-500 圆
│               ╰───╯                  │
│            支付成功                    │  title-1
│         实付 ¥1,435.00                │  metric
│                                      │
│ ┌──────────────────────────────────┐ │  RewardCard（浅息青渐变 + 柔光）
│ │ 🎁 本次获得                        │ │
│ │  +200 健康积分          ← 数字滚动 │ │  metric primary-600
│ │ ┌──────────────────────────────┐ │ │
│ │ │ 专属脉诊体验卡 × 3 次          │ │ │  卡片翻转入场
│ │ │ 深度体质报告 · 有效期 90 天    │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 设备预计 9月21日 送达                  │  body-sm ink-500
│ [      先看看怎么佩戴 →       ]       │  Button primary lg → wear-guide
│   查看订单     ·     继续逛逛          │  ghost
└──────────────────────────────────────┘
```

### 7.13 我的订单

```text
┌──────────────────────────────────────┐
│ ←  我的订单                           │
│ 全部  待付款•1  待发货  待收货  已完成 │  SegmentedTabs，下划线滑动
│ ─────                                │
│ ┌──────────────────────────────────┐ │  OrderCard
│ │ 2026-09-19 10:21          待付款  │ │  状态：warning 色
│ │ ┌──┐┌──┐┌──┐          共 3 件    │ │
│ │ └──┘└──┘└──┘      实付 ¥1,435    │ │
│ │ 剩余 14:52     [取消订单] [去付款] │ │  secondary / primary sm
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 2026-09-10 18:03          待收货  │ │
│ │ ┌──┐ 玫瑰花茶 × 2        ¥136     │ │
│ │                [查看物流][确认收货]│ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 7.14 我的

```text
┌──────────────────────────────────────┐
│                               ⚙      │
│ ╭──╮ 林一                    编辑 >   │  ProfileHeader
│ ╰──╯ 女 · 32 岁                       │
│      [气郁质] [兼 气虚质]              │  Chip
│                                      │
│ ┌──────────────────────────────────┐ │  LevelProgress（浅息青底）
│ │ Lv.3 养息者     1,280 积分    >   │ │
│ │ ██████████░░░░  距 Lv.4 还差 220  │ │
│ │ 🏅🏅🏅○○  已获 3 枚勋章            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 我的设备                              │
│ ┌──────────────────────────────────┐ │
│ │ ◯ 脉搏环 Pro   ● 已连接   🔋 82%  │ │
│ │ 固件 v1.2.0（有新版本 •）          │ │
│ │ ──────────────────────────────── │ │
│ │ 固件升级 │ 重新校准 │ 佩戴教学 │ 解绑│ │  4 宫格，解绑 ink-500
│ └──────────────────────────────────┘ │
│                                      │
│ 商城服务                              │
│ ┌──────────────────────────────────┐ │
│ │ 待付款• 待发货  待收货  售后   全部 │ │  订单状态快捷入口带角标
│ ├──────────────────────────────────┤ │
│ │ 📍 地址管理                     > │ │
│ │ 🧾 发票与售后                   > │ │
│ │ 💬 联系客服                     > │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 8. 合规与风险

| 风险 | 说明 | 建议 |
|---|---|---|
| **医疗宣称** | "医疗级"、"诊断"、"治疗"等用语受《医疗器械监督管理条例》《广告法》约束 | 设备若未取得二类医疗器械注册证，文案统一用"健康监测""健康参考"；"医疗级"标签只用于有注册证的商品，并在详情页展示证号 |
| **健康数据隐私** | 脉搏、体质属于《个人信息保护法》中的敏感个人信息 | 首启协议 + **单独同意**健康数据处理；提供数据导出与账号注销；日志中不打印原始健康数据 |
| **隐私合规检测** | 国内应用商店要求：同意隐私政策前不得收集信息、不得初始化三方 SDK | 所有 SDK（Sentry、微信、统计）在同意后再初始化 |
| **Apple 登录** | App Store 审核 4.8：提供微信等第三方登录时须提供 Sign in with Apple 或同等选项 | iOS 端加入 Apple 登录 |
| **支付界面仿冒** | 自绘仿微信收银台会被认定为仿冒 | 见 §4.5.5，只做自有确认卡片 + 拉起微信 |
| **iOS 内购** | 实体商品（设备、补剂）可用微信支付；若将来售卖**虚拟服务**（会员、付费报告）须走 IAP | 体验卡以"赠送"形式发放，不单独售卖；会员上线前评估 IAP |
| **报告免责** | 中医调理建议属于健康建议 | 每份报告底部固定免责声明；穴位/饮食建议由有资质的中医顾问审核 |
| **BLE 碎片化** | 国产 Android 厂商对 BLE 后台、连接数、MTU 行为差异大 | 真机矩阵回归；保留原生 BLE 层替换通道 |

---

## 9. 开发里程碑

| 阶段 | 内容 | 预估 |
|---|---|---|
| **M0 工程基建** | Expo 项目、目录规范、ESLint 边界、CI、EAS profiles、网络层、MMKV/SecureStore、Sentry、MockBleService | 1–2 周 |
| **M1 设计系统** | Tokens、基础组件、TabBar、GlassCard、Skeleton/Empty/Error、组件预览页（内部 Storybook 路由） | 2 周（与 M0 并行） |
| **M2 设备链路** | BLE 权限/扫描/连接/状态机、协议层、扫描页（雷达 + 3D）、确认绑定、佩戴教学 | 3 周 |
| **M3 脉诊与报告** | 数据管线、波形、信号质量、阶段进度、测量页、报告详情、报告列表、趋势、首页 | 3–4 周 |
| **M4 商城闭环** | 商城首页、商品详情、购物车、确认订单、微信 SDK 模块、支付、支付结果、订单列表/详情/物流 | 3 周 |
| **M5 我的与增长** | 个人中心、体质档案、设备管理、OTA、校准、积分、勋章、地址、发票售后、设置 | 2–3 周 |
| **M6 稳定与上线** | 真机矩阵回归、性能优化、Maestro 全链路、隐私合规检测、提审 | 2 周 |

M2 与 M4 可由不同成员并行。

---

## 10. 待确认事项

| # | 问题 | 负责方 | 影响 |
|---|---|---|---|
| 1 | TabBar 最终顺序：脉诊居中凸起（推荐）还是放第 2 位？ | 产品 | §2.1 |
| 2 | BLE 协议文档：服务/特征值 UUID、帧格式、采样率、每包样本数、是否有 MTU 协商 | 硬件 | §5.5、§5.6 |
| 3 | 测量阶段是否为"浮取/中取/沉取"加压过程？单次测量时长？ | 硬件 + 算法 | §4.2.2 进度设计 |
| 4 | 信号质量由设备端计算还是 App 端计算？算法由谁提供？ | 算法 | §5.6 |
| 5 | 脉象指标最终维度与参考区间、九种体质的判定输出格式 | 算法 + 中医顾问 | §4.3.2 |
| 6 | 设备是否有加速度计（用于运动干扰识别）？ | 硬件 | 信号质量文案 |
| 7 | 设备是否已/计划取得医疗器械注册证？ | 法务 | 全局文案 |
| 8 | OTA 方案：芯片平台（Nordic / TI / 国产）及 DFU 协议 | 硬件 | §4.6 固件升级 |
| 9 | 佩戴方向：传感器朝向手腕内侧还是外侧？"腕骨"指尺骨茎突还是桡骨茎突？ | 硬件 + 设计 | §4.4.3 插画 |
| 10 | 订单状态是否增加"待收货"？是否需要"退款/售后"Tab？ | 产品 | §4.5.7 |
| 11 | 积分规则与勋章体系（获取、消耗、等级阈值） | 运营 | §4.6 |
| 12 | 是否需要游客模式（未登录浏览商城）？ | 产品 | 路由守卫 |
