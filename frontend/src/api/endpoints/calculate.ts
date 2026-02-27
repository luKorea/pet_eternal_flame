import { request } from '../client'
import type { CalculateRequest, CalculateResponse } from '@/types/api'

/** 祭祀计算；token 与 locale 由 client 自动附带 */
export async function calculateRitual(body: CalculateRequest): Promise<CalculateResponse> {
  return request<CalculateResponse>('/api/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
