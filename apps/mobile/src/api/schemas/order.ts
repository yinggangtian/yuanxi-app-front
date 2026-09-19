import { z } from 'zod';

import { moneyInCents } from './common';

/**
 * 订单状态（§4.5.7）。
 * 采纳文档建议补「待收货」，否则已发货订单无处归类（§10 待确认 10）。
 */
export const orderStatusSchema = z.enum([
  'pending-payment',
  'pending-shipment',
  'pending-receipt',
  'completed',
  'cancelled',
  'after-sales',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  'pending-payment': '待付款',
  'pending-shipment': '待发货',
  'pending-receipt': '待收货',
  completed: '已完成',
  cancelled: '已取消',
  'after-sales': '售后中',
};

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  skuId: z.string(),
  title: z.string(),
  skuName: z.string(),
  imageUrl: z.string(),
  price: moneyInCents,
  quantity: z.number().int().min(1),
  stock: z.number().int(),
  purchaseLimit: z.number().int().nullable().default(null),
  selected: z.boolean().default(true),
  /** 下架 / 无货 —— 进入失效商品区（§4.5.3） */
  invalid: z.boolean().default(false),
  invalidReason: z.string().nullable().default(null),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  title: z.string(),
  skuName: z.string(),
  imageUrl: z.string(),
  price: moneyInCents,
  quantity: z.number().int(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const addressSchema = z.object({
  id: z.string(),
  receiver: z.string(),
  phone: z.string(),
  province: z.string(),
  city: z.string(),
  district: z.string(),
  detail: z.string(),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof addressSchema>;

export const orderSummarySchema = z.object({
  id: z.string(),
  orderNo: z.string(),
  status: orderStatusSchema,
  createdAt: z.string(),
  items: z.array(orderItemSchema),
  totalQuantity: z.number().int(),
  /** 实付金额（分） */
  payAmount: moneyInCents,
  /** 待付款订单的支付截止时间 */
  payExpireAt: z.string().nullable().default(null),
  /** 是否包含设备类商品 —— 决定支付成功页的主引导（§4.5.6） */
  containsDevice: z.boolean().default(false),
});

export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const logisticsNodeSchema = z.object({
  time: z.string(),
  description: z.string(),
});

export const orderDetailSchema = orderSummarySchema.extend({
  address: addressSchema.nullable().default(null),
  /** 商品小计 */
  goodsAmount: moneyInCents,
  freightAmount: moneyInCents.default(0),
  discountAmount: moneyInCents.default(0),
  pointsDeduction: moneyInCents.default(0),
  remark: z.string().default(''),
  paidAt: z.string().nullable().default(null),
  logistics: z.array(logisticsNodeSchema).default([]),
  logisticsCompany: z.string().nullable().default(null),
  logisticsNo: z.string().nullable().default(null),
});

export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type LogisticsNode = z.infer<typeof logisticsNodeSchema>;

/** 服务端预订单计算结果 —— **最终金额以此为准**（§4.5.3）。 */
export const checkoutPreviewSchema = z.object({
  items: z.array(orderItemSchema),
  goodsAmount: moneyInCents,
  freightAmount: moneyInCents,
  discountAmount: moneyInCents,
  /** 可用积分抵扣上限 */
  maxPointsDeduction: moneyInCents,
  payAmount: moneyInCents,
  address: addressSchema.nullable().default(null),
  containsDevice: z.boolean().default(false),
});

export type CheckoutPreview = z.infer<typeof checkoutPreviewSchema>;

/** 支付结果查询 —— **以服务端订单状态为准**（§3.4 / §5.7）。 */
export const paymentStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['paid', 'unpaid', 'processing', 'closed']),
  paidAmount: moneyInCents.nullable().default(null),
  /** 支付成功赠送的积分（§4.5.6） */
  rewardPoints: z.number().int().default(0),
  /** 赠送的脉诊体验卡 */
  rewardCards: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        count: z.number().int(),
        expireAt: z.string(),
      }),
    )
    .default([]),
  estimatedDeliveryAt: z.string().nullable().default(null),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
