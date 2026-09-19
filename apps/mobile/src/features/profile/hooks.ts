import { useQuery } from '@tanstack/react-query';

import { queryKeys, staleTimes } from '../../api/queryKeys';
import type { UserProfile } from '../../api/schemas/user';
import { mockProfile } from '../../mocks';

/** 当前用户档案。 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: async (): Promise<UserProfile> => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return mockProfile;
    },
    staleTime: staleTimes.detail,
  });
}

/** 节气文案（§7.2 首页「9月19日 · 白露后第12天」）。 */
const SOLAR_TERMS: { month: number; day: number; name: string }[] = [
  { month: 0, day: 6, name: '小寒' }, { month: 0, day: 20, name: '大寒' },
  { month: 1, day: 4, name: '立春' }, { month: 1, day: 19, name: '雨水' },
  { month: 2, day: 6, name: '惊蛰' }, { month: 2, day: 21, name: '春分' },
  { month: 3, day: 5, name: '清明' }, { month: 3, day: 20, name: '谷雨' },
  { month: 4, day: 6, name: '立夏' }, { month: 4, day: 21, name: '小满' },
  { month: 5, day: 6, name: '芒种' }, { month: 5, day: 21, name: '夏至' },
  { month: 6, day: 7, name: '小暑' }, { month: 6, day: 23, name: '大暑' },
  { month: 7, day: 8, name: '立秋' }, { month: 7, day: 23, name: '处暑' },
  { month: 8, day: 8, name: '白露' }, { month: 8, day: 23, name: '秋分' },
  { month: 9, day: 8, name: '寒露' }, { month: 9, day: 24, name: '霜降' },
  { month: 10, day: 7, name: '立冬' }, { month: 10, day: 22, name: '小雪' },
  { month: 11, day: 7, name: '大雪' }, { month: 11, day: 22, name: '冬至' },
];

/**
 * 当前节气与距其天数。
 *
 * 用固定日期近似（实际节气每年浮动 1–2 天），仅作氛围文案，不参与任何计算。
 */
export function solarTermLabel(date: Date = new Date()): string {
  const month = date.getMonth();
  const day = date.getDate();

  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1] as (typeof SOLAR_TERMS)[number];
  let currentDate = new Date(date.getFullYear() - 1, current.month, current.day);

  for (const term of SOLAR_TERMS) {
    const termDate = new Date(date.getFullYear(), term.month, term.day);
    if (termDate.getTime() <= new Date(date.getFullYear(), month, day).getTime()) {
      current = term;
      currentDate = termDate;
    }
  }

  const days = Math.floor(
    (new Date(date.getFullYear(), month, day).getTime() - currentDate.getTime()) / 86_400_000,
  );

  return days === 0 ? current.name : `${current.name}后第 ${days} 天`;
}
