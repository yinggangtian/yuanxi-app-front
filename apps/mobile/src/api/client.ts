import Constants from 'expo-constants';
import type { z } from 'zod';

import { logger } from '../lib/logger';
import { tokenStore } from '../lib/storage';

/**
 * 网络层（设计文档 §5.8）。
 *
 * - 统一注入 token；401 → refresh → 重放原请求
 * - 所有响应用 Zod 校验；校验失败上报并降级，而不是把脏数据放进 UI
 */

export const API_BASE_URL =
  (Constants.expoConfig?.extra?.['apiBaseUrl'] as string | undefined) ??
  'https://api.yuanxi.example.com';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 响应结构与约定不符 —— 属于前后端契约问题，需上报。 */
export class SchemaError extends Error {
  constructor(
    readonly path: string,
    readonly issues: string,
  ) {
    super(`响应结构校验失败：${path}`);
    this.name = 'SchemaError';
  }
}

export interface RequestOptions<TSchema extends z.ZodTypeAny> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** 响应体 schema；省略则不校验（仅用于 204 之类的空响应） */
  schema?: TSchema;
  /** 是否需要登录态，默认 true */
  auth?: boolean;
  signal?: AbortSignal;
}

/** 刷新 token 的并发去重 —— 多个 401 只触发一次 refresh。 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;

      const payload = (await response.json()) as {
        data?: { accessToken?: string; refreshToken?: string };
      };
      const accessToken = payload.data?.accessToken;
      const nextRefreshToken = payload.data?.refreshToken;
      if (!accessToken || !nextRefreshToken) return false;

      await tokenStore.save(accessToken, nextRefreshToken);
      return true;
    } catch (error) {
      logger.warn('刷新 token 失败', { error: String(error) });
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** 登录态失效的回调 —— 由 session store 注册，避免 api 层反向依赖 stores。 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

async function rawRequest(
  path: string,
  options: RequestOptions<z.ZodTypeAny>,
  withAuth: boolean,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (withAuth) {
    const accessToken = await tokenStore.getAccessToken();
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
}

/**
 * 发起请求。
 *
 * @throws {ApiError} HTTP 或业务错误
 * @throws {SchemaError} 响应结构不符合 schema
 */
export async function request<TSchema extends z.ZodTypeAny>(
  path: string,
  options: RequestOptions<TSchema> = {},
): Promise<z.infer<TSchema>> {
  const needsAuth = options.auth ?? true;

  let response = await rawRequest(path, options, needsAuth);

  // 401 → 刷新一次 → 重放；仍失败则判定登录态失效
  if (response.status === 401 && needsAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await rawRequest(path, options, true);
    }
    if (response.status === 401) {
      await tokenStore.clear();
      onUnauthorized?.();
      throw new ApiError('登录已失效，请重新登录', 401);
    }
  }

  if (!response.ok) {
    throw new ApiError(`请求失败（${response.status}）`, response.status);
  }

  if (response.status === 204 || !options.schema) {
    return undefined as z.infer<TSchema>;
  }

  const payload: unknown = await response.json();
  const parsed = options.schema.safeParse(payload);

  if (!parsed.success) {
    // 契约问题需要被发现，而不是静默降级成空白页
    const issues = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    logger.error('响应结构校验失败', { path, issues });
    throw new SchemaError(path, issues);
  }

  return parsed.data as z.infer<TSchema>;
}

export const api = {
  get: <TSchema extends z.ZodTypeAny>(path: string, schema: TSchema, auth = true) =>
    request(path, { method: 'GET', schema, auth }),
  post: <TSchema extends z.ZodTypeAny>(
    path: string,
    body: unknown,
    schema?: TSchema,
    auth = true,
  ) => request(path, { method: 'POST', body, schema, auth }),
  put: <TSchema extends z.ZodTypeAny>(path: string, body: unknown, schema?: TSchema) =>
    request(path, { method: 'PUT', body, schema }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
