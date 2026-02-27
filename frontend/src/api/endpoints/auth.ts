import { request } from '../client'
import type { User, LoginRequest, LoginResponse } from '@/types/api'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function register(body: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** 管理员登录接口 */
export async function adminLogin(body: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** 当前用户信息；token 由 client 自动从 localStorage 附带 */
export async function getMe(): Promise<{ user: User }> {
  return request<{ user: User }>('/api/auth/me', { method: 'GET' })
}
