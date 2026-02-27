import { useEffect, useState, useCallback } from 'react';
import useSWR, { mutate, type SWRConfiguration, type KeyedMutator } from 'swr';
import { message } from 'antd';
import adminApiClient from '@/api/client';

/** 运营后台 SWR 缓存 key，便于 mutate 时复用 */
export const ADMIN_SWR_KEYS = {
  languageStrings: '/api/admin/language-strings',
  users: (page: number, search: string) => ['admin-users', page, search] as const,
  stats: 'admin-stats',
  calculateLogs: (page: number) => ['admin-calculate-logs', page] as const,
  settings: 'admin-settings',
  announcements: 'admin-announcements',
} as const;

/** 默认 GET fetcher：用 adminApiClient 请求 URL，返回 response.data */
export const adminSwrFetcher = <T = unknown>(url: string): Promise<T> =>
  adminApiClient.get<T>(url).then((res) => res.data as T);

export type UseAdminSWROptions<T> = SWRConfiguration<T> & {
  /** 请求失败时展示的错误文案，不传则不自动 toast */
  errorMessage?: string;
};

export interface UseAdminMutationOptions<TResult> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: TResult) => void;
  onError?: (error: any) => void;
}

/**
 * 运营后台封装的 useSWR：
 * - 支持只传 key（且为 string 时）时使用 adminSwrFetcher 发 GET
 * - 可选 errorMessage，在 error 时自动 message.error
 */
export function useAdminSWR<T, K extends string | readonly unknown[] = string>(
  key: K,
  fetcher?: (key: K) => Promise<T>,
  options?: UseAdminSWROptions<T>
): ReturnType<typeof useSWR<T, Error, K>> & { mutate: KeyedMutator<T> } {
  const { errorMessage, ...swrOptions } = options ?? {};
  const isUrlKey = typeof key === 'string' && key.startsWith('/');
  const fetcherFn = fetcher ?? (isUrlKey ? (() => adminSwrFetcher<T>(key as string)) : undefined);

  const result = useSWR<T, Error, K>(key, fetcherFn as any, swrOptions as any);

  useEffect(() => {
    if (errorMessage && result.error) {
      message.error(result.error.message || errorMessage);
    }
  }, [errorMessage, result.error]);

  return result as ReturnType<typeof useSWR<T, Error, K>> & { mutate: KeyedMutator<T> };
}

export function useAdminMutation<TArgs = void, TResult = unknown>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  options?: UseAdminMutationOptions<TResult>
) {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(
    async (args: TArgs): Promise<TResult | undefined> => {
      setLoading(true);
      try {
        const result = await mutationFn(args);
        if (options?.successMessage) {
          message.success(options.successMessage);
        }
        options?.onSuccess?.(result);
        return result;
      } catch (error: any) {
        if (options?.errorMessage) {
          message.error(error?.message || options.errorMessage);
        }
        options?.onError?.(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { trigger, loading };
}

export { mutate };
export default useAdminSWR;
