/**
 * 通用请求客户端：统一处理 baseURL、鉴权、JSON 解析与错误信息。
 * 所有接口（祭祀计算、登录等）都通过此 client 发起，便于扩展与维护。
 */

export type RequestInitWithAuth = RequestInit & {
  /** 可选：Bearer token，后续登录功能会从此注入 */
  token?: string | null
}

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
}

/**
 * 发起请求并解析 JSON，非 2xx 时抛出带后端 message 的 Error。
 * 前端可翻译的错误使用 error.xxx 作为 message，便于 i18n。
 */
export async function request<T = unknown>(
  url: string,
  init?: RequestInitWithAuth
): Promise<T> {
  const { token, headers: initHeaders, ...rest } = init ?? {}
  const headers = new Headers(defaultHeaders)
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
