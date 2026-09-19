import { z } from 'zod';

/** 九种中医体质（§4.3.2）。 */
export const constitutionTypeSchema = z.enum([
  'balanced', // 平和质
  'qi-deficiency', // 气虚质
  'yang-deficiency', // 阳虚质
  'yin-deficiency', // 阴虚质
  'phlegm-damp', // 痰湿质
  'damp-heat', // 湿热质
  'blood-stasis', // 血瘀质
  'qi-stagnation', // 气郁质
  'special', // 特禀质
]);

export type ConstitutionType = z.infer<typeof constitutionTypeSchema>;

/** 体质中文名映射 —— UI 一律通过此表展示，避免各页面各写一套。 */
export const CONSTITUTION_LABEL: Record<ConstitutionType, string> = {
  balanced: '平和质',
  'qi-deficiency': '气虚质',
  'yang-deficiency': '阳虚质',
  'yin-deficiency': '阴虚质',
  'phlegm-damp': '痰湿质',
  'damp-heat': '湿热质',
  'blood-stasis': '血瘀质',
  'qi-stagnation': '气郁质',
  special: '特禀质',
};

export const userProfileSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatarUrl: z.string().nullable().default(null),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  /** 出生年份；档案未完善时为 null */
  birthYear: z.number().int().nullable().default(null),
  heightCm: z.number().nullable().default(null),
  weightKg: z.number().nullable().default(null),
  /** 主体质 */
  primaryConstitution: constitutionTypeSchema.nullable().default(null),
  /** 兼夹体质 */
  secondaryConstitutions: z.array(constitutionTypeSchema).default([]),
  /** 健康积分 */
  points: z.number().int().default(0),
  level: z.number().int().default(1),
  levelName: z.string().default('养息者'),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/** 档案是否完善 —— 首次测量前的拦截依据（§2.3 路由守卫）。 */
export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return profile.gender !== 'unknown' && profile.birthYear !== null;
}
