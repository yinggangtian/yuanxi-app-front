/**
 * 展示格式化。
 *
 * 金额一律以「分」为单位在代码中流转，只在展示时转成元 —— 避免浮点累加误差。
 */

/** 分 → 「¥1,299.00」。 */
export function formatPrice(cents: number, withSymbol = true): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const yuan = Math.floor(abs / 100);
  const fraction = abs % 100;

  const grouped = yuan.toLocaleString('zh-CN');
  const text = `${grouped}.${String(fraction).padStart(2, '0')}`;

  return `${negative ? '-' : ''}${withSymbol ? '¥' : ''}${text}`;
}

/** 分 → 「1,299」（整数元，用于列表等空间紧张处；有角分时仍显示小数）。 */
export function formatPriceCompact(cents: number): string {
  return cents % 100 === 0
    ? `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`
    : formatPrice(cents);
}

/** 秒 → 「14:52」倒计时。负数归零。 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 剩余毫秒 → 倒计时文字。 */
export function formatRemaining(expireAt: string | null, now: number = Date.now()): string | null {
  if (!expireAt) return null;
  const remaining = new Date(expireAt).getTime() - now;
  if (Number.isNaN(remaining)) return null;
  return formatCountdown(remaining / 1000);
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 「9月19日 08:12」。 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
}

/** 「9/19」——图表刻度用。 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** 相对日期：今天 / 昨天 / 周三 / 9月19日。 */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const startOf = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (dayDiff === 0) return '今天';
  if (dayDiff === 1) return '昨天';
  if (dayDiff > 1 && dayDiff < 7) return WEEKDAYS[date.getDay()] ?? '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 依据小时给出问候语（§7.2 首页）。 */
export function greeting(hour: number = new Date().getHours()): string {
  if (hour < 5) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/** 脱敏：SN 只显示后四位（§7.7「SN ····8F2A」）。 */
export function maskSn(sn: string): string {
  if (sn.length <= 4) return sn;
  return `····${sn.slice(-4)}`;
}

/** 手机号脱敏。 */
export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}
