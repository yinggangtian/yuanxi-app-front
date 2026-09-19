import { z } from 'zod';

import { constitutionTypeSchema } from './user';

/** 指标状态 —— 必须同时有文字标签，不靠颜色单独表达（§1.3 原则 2）。 */
export const metricStatusSchema = z.enum(['normal', 'attention', 'abnormal']);
export type MetricStatus = z.infer<typeof metricStatusSchema>;

export const METRIC_STATUS_LABEL: Record<MetricStatus, string> = {
  normal: '正常',
  attention: '关注',
  abnormal: '异常',
};

/** 多维脉象指标（§4.3.2）。最终维度与参考区间以算法组输出为准（§10 待确认 5）。 */
export const pulseMetricSchema = z.object({
  key: z.enum(['rate', 'rhythm', 'position', 'strength', 'fluency', 'tension']),
  label: z.string(),
  /** 展示值，如「72 次/分」「偏沉」 */
  displayValue: z.string(),
  /** 归一化到 0–100，用于雷达图 */
  normalized: z.number().min(0).max(100),
  /** 参考区间文字，如「60–100」 */
  referenceRange: z.string().nullable().default(null),
  status: metricStatusSchema,
});

export type PulseMetric = z.infer<typeof pulseMetricSchema>;

/** 体质倾向。 */
export const constitutionScoreSchema = z.object({
  type: constitutionTypeSchema,
  label: z.string(),
  percent: z.number().min(0).max(100),
  primary: z.boolean().default(false),
  /** 点击查看的释义 */
  description: z.string().default(''),
});

/** 调理建议分类（§4.3.2）。 */
export const adviceCategorySchema = z.enum(['diet', 'sleep', 'exercise', 'acupoint', 'emotion']);
export type AdviceCategory = z.infer<typeof adviceCategorySchema>;

export const ADVICE_CATEGORY_LABEL: Record<AdviceCategory, string> = {
  diet: '饮食',
  sleep: '作息',
  exercise: '运动',
  acupoint: '穴位',
  emotion: '情志',
};

export const adviceSchema = z.object({
  id: z.string(),
  category: adviceCategorySchema,
  title: z.string(),
  content: z.string(),
  /** 穴位示意图 */
  imageUrl: z.string().nullable().default(null),
});

export type Advice = z.infer<typeof adviceSchema>;

/** 报告列表项。 */
export const reportSummarySchema = z.object({
  id: z.string(),
  measuredAt: z.string(),
  score: z.number().min(0).max(100),
  /** 评分等级文字，如「良好」 */
  scoreLevel: z.string(),
  /** 脉象结论，如「弦细脉」 */
  pulsePattern: z.string(),
  primaryConstitutionLabel: z.string(),
  /** 与上次的差值，首份报告为 null */
  deltaFromPrevious: z.number().nullable().default(null),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

/** 报告详情。 */
export const reportDetailSchema = reportSummarySchema.extend({
  /** 脉象结论的通俗解释 */
  pulsePatternExplanation: z.string(),
  constitutions: z.array(constitutionScoreSchema),
  metrics: z.array(pulseMetricSchema),
  advices: z.array(adviceSchema),
  /** 原始波形回放片段（降采样后） */
  waveformPreview: z.array(z.number()).default([]),
});

export type ReportDetail = z.infer<typeof reportDetailSchema>;

/** 趋势数据点。 */
export const trendPointSchema = z.object({
  date: z.string(),
  label: z.string(),
  score: z.number(),
});

export type TrendPoint = z.infer<typeof trendPointSchema>;

/**
 * 报告免责声明（§4.3.2 / §8）——固定文案，所有报告页底部必须展示。
 * 集中在此，避免各页面自行改写导致合规口径不一致。
 */
export const REPORT_DISCLAIMER =
  '本报告基于脉搏信号分析，仅供健康参考，不能替代医生诊断。如有不适请及时就医。';

// 注：同一文案也收录在 src/lib/i18n/locales/zh-CN.ts 的 compliance.reportDisclaimer，
// 两处必须保持一致；下方断言在文案漂移时会直接编译失败。
