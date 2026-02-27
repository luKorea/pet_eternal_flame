/**
 * 通用请求客户端：统一处理鉴权、locale、JSON 解析与错误信息。
 * - 所有请求自动带 Accept-Language（当前界面语言），后端据此返回/翻译文案。
 * - 未显式传 token 时，自动从 localStorage 读取并带 Authorization，便于登录后业务扩展。
 */

import { getApiLocale } from '@/i18n'
import i18n from '@/i18n'
import { AUTH_TOKEN_KEY } from '@/store/atoms'

export type RequestInitWithAuth = RequestInit & {
  /** 不传则自动从 localStorage 取；传 null 表示强制不带 token（如公开接口） */
  token?: string | null
}

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
}

function getRequestLocale(): string {
  return getApiLocale(i18n.language)
}

/** 未显式传 token 时从 localStorage 取，保证登录后所有请求自动带 token */
function getRequestToken(explicitToken: string | null | undefined): string | null {
  if (explicitToken !== undefined) return explicitToken ?? null
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * 发起请求；自动带 Accept-Language 与 Authorization（有 token 时），非 2xx 抛 Error。
 */
export async function request<T = unknown>(
  url: string,
  init?: RequestInitWithAuth
): Promise<T> {
  const { token: explicitToken, headers: initHeaders, ...rest } = init ?? {}
  const headers = new Headers(defaultHeaders)
  headers.set('Accept-Language', getRequestLocale())
  const token = getRequestToken(explicitToken)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (initHeaders) {
    const extra = new Headers(initHeaders)
    extra.forEach((v, k) => headers.set(k, v))
  }

  const res = await fetch(url, { ...rest, headers })
  const text = await res.text()
  let data: { error?: string } = {}
  try {
    if (text) data = JSON.parse(text) as { error?: string }
  } catch {
    if (!res.ok) {
      throw new Error(res.status === 403 ? 'error.forbidden' : 'error.requestFailed')
    }
    throw new Error('error.invalidResponse')
  }

  if (!res.ok) {
    const backendMsg = (data as { error?: string }).error
    throw new Error(backendMsg ?? 'error.requestFailed')
  }

  return data as T
}
