import { z } from 'zod';

import { moneyInCents } from './common';

/** 商品标签，如「医疗级」「疏肝理气」。 */
export const productTagSchema = z.object({
  label: z.string(),
  /**
   * 「医疗级」等资质标签只允许在有注册证的商品上使用（§8 合规）。
   * 带此标记的标签，详情页必须同时展示注册证号。
   */
  requiresCertificate: z.boolean().default(false),
});

export const skuSchema = z.object({
  id: z.string(),
  /** 规格名，如「星空灰 · 标准版」 */
  name: z.string(),
  price: moneyInCents,
  originalPrice: moneyInCents.nullable().default(null),
  stock: z.number().int(),
  /** 限购数量，null 表示不限 */
  purchaseLimit: z.number().int().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
});

export type Sku = z.infer<typeof skuSchema>;

export const productSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string(),
  price: moneyInCents,
  originalPrice: moneyInCents.nullable().default(null),
  tags: z.array(productTagSchema).default([]),
  /** 「根据你的体质推荐」标记 */
  recommendedReason: z.string().nullable().default(null),
});

export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productDetailSchema = productSummarySchema.extend({
  images: z.array(z.string()),
  description: z.string(),
  /** 资质 / 医疗器械注册证号（§8） */
  certificateNumber: z.string().nullable().default(null),
  detailImages: z.array(z.string()).default([]),
  skus: z.array(skuSchema),
  /** 是否为设备类商品 —— 支付成功后引导「先看佩戴教学」（§4.5.6） */
  isDevice: z.boolean().default(false),
});

export type ProductDetail = z.infer<typeof productDetailSchema>;

/** 金刚区品类（§4.5.1）。 */
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Lucide 图标名 */
  icon: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const bannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  badge: z.string().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  /** 点击跳转的商品 id */
  productId: z.string().nullable().default(null),
});

export type Banner = z.infer<typeof bannerSchema>;
