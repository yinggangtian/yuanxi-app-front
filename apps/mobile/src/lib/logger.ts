/**
 * 日志（设计文档 §8）。
 *
 * ⚠️ 合规要求：**日志中不得打印原始健康数据**（脉搏波形、体质结论等
 * 属于《个人信息保护法》定义的敏感个人信息）。
 * 需要排查测量问题时只记录统计量（样本数、质量分、阶段），不记录样本本身。
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV !== 'production';

/** 疑似健康数据的字段名 —— 命中时只记录长度/摘要。 */
const SENSITIVE_KEYS = new Set([
  'samples',
  'waveform',
  'rawData',
  'signal',
  'constitution',
  'phone',
  'idCard',
  'address',
]);

/** 递归脱敏：敏感字段只保留类型与规模信息。 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return `[Array(${value.length})]`;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = Array.isArray(item) ? `[redacted ${item.length} items]` : '[redacted]';
    } else {
      result[key] = redact(item, depth + 1);
    }
  }
  return result;
}

function write(level: LogLevel, message: string, context?: unknown): void {
  if (!isDev && level === 'debug') return;
  const payload = context === undefined ? '' : JSON.stringify(redact(context));

  if (level === 'error') console.error(`[yuanxi] ${message}`, payload);
  else if (level === 'warn') console.warn(`[yuanxi] ${message}`, payload);
  else if (isDev) console.warn(`[yuanxi:${level}] ${message}`, payload);
}

export const logger = {
  debug: (message: string, context?: unknown) => write('debug', message, context),
  info: (message: string, context?: unknown) => write('info', message, context),
  warn: (message: string, context?: unknown) => write('warn', message, context),
  error: (message: string, context?: unknown) => write('error', message, context),
};
