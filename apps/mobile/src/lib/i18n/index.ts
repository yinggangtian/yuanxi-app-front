import { zhCN, type Translations } from './locales/zh-CN';

/**
 * i18n（设计文档 §5.1）。
 *
 * 首发仅中文。此处提供**类型安全的文案访问**，
 * 待需要多语言时接入 i18next 而无需改动调用点。
 */
const resources = { 'zh-CN': zhCN } as const;

export type Locale = keyof typeof resources;

let currentLocale: Locale = 'zh-CN';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/** 当前语言的全部文案。 */
export function t(): Translations {
  return resources[currentLocale];
}

export { zhCN, type Translations };
