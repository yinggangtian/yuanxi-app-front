/**
 * 中文文案（设计文档 §5.1：首发仅中文，但文案从第一天起集中管理）。
 *
 * 收录范围：**合规文案、状态文案、异常文案** —— 这些是最需要统一口径、
 * 最不能在各页面自行改写的部分（§8）。
 * 纯装饰性标题可留在组件内，避免过早抽象。
 */
export const zhCN = {
  common: {
    confirm: '确认',
    cancel: '取消',
    retry: '重试',
    save: '保存',
    loading: '加载中…',
  },

  // 合规文案 —— 改动需经法务确认（§8）
  compliance: {
    reportDisclaimer: '本报告基于脉搏信号分析，仅供健康参考，不能替代医生诊断。如有不适请及时就医。',
    productDisclaimer: '本商品为健康类产品，相关描述不构成医疗建议，不能替代医生诊断与治疗。',
    paymentSecurity: '支付由微信支付提供安全保障',
    healthDataConsent:
      '我同意元息处理我的健康数据（脉搏信号、脉象与体质分析结果），用于生成健康报告',
    privacyConsent: '我已阅读并同意《用户协议》与《隐私政策》',
    accountDeletion:
      '注销后，你的账号、健康报告与体质档案将被删除或匿名化处理，且无法恢复。已完成的订单记录将依法保留。',
  },

  // 蓝牙与设备异常（§3.4）
  bluetooth: {
    poweredOff: '请开启手机蓝牙后继续',
    unauthorized: '元息需要蓝牙权限才能连接脉搏环',
    unsupported: '当前设备不支持低功耗蓝牙，无法连接脉搏环',
    scanning: '正在寻找你的脉搏环…',
    scanHint: '请将设备靠近手机，长按按键 3 秒开机。',
    notFound: '确认设备已开机并靠近手机',
    disconnected: '设备连接已断开，正在尝试重连…',
  },

  // 信号质量（§4.2.2）
  signal: {
    good: '信号良好',
    fair: '信号一般，请保持静止',
    poor: '接触不良，请调整佩戴',
    checking: '正在检测信号…',
    reasonLoose: '佩戴过松，请适当收紧后重新贴合',
    reasonMotion: '检测到手腕晃动，请保持静坐',
    reasonContact: '传感器接触不良，请将设备向腕骨方向移动',
  },

  // 测量流程（§4.2.2）
  measurement: {
    exitTitle: '确定要退出测量吗？',
    exitMessage: '退出将丢弃本次测量，已采集的数据不会被保存。',
    encourage: '做得很好，请保持手腕放松',
    analyzing: '正在生成报告',
    offlineFallback: '当前无网络，测量数据已在本地保存，恢复网络后会自动上传。',
  },

  // 支付（§3.4 / §4.5.6）
  payment: {
    processing: '支付确认中',
    processingHint:
      '我们正在与支付平台确认，结果会在「我的订单」中更新。若已扣款请勿重复支付。',
    expired: '支付已超时，订单可能已关闭',
    wechatNotInstalled: '未检测到微信，请安装后重试或选择其它支付方式',
  },

  // 统一状态（§4.7）
  state: {
    offlineTitle: '网络连接不可用',
    offlineDescription:
      '请检查网络连接后重试。已完成的测量数据已在本地保存，恢复网络后会自动上传。',
    emptyReports: '还没有健康报告',
    emptyCart: '购物车还是空的',
    emptyOrders: '暂无相关订单',
  },
} as const;

export type Translations = typeof zhCN;
