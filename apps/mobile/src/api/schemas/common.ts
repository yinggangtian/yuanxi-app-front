import { z } from 'zod';

/** 统一响应信封。 */
export const apiEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    code: z.number(),
    message: z.string().default(''),
    data,
  });

/** 分页响应。 */
export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/** ISO 8601 时间字符串。 */
export const isoDateTime = z.string();

/** 金额一律用「分」传输，避免浮点误差。 */
export const moneyInCents = z.number().int();
