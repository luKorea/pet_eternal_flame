import { request } from '../client'
import type { CalculateRequest, CalculateResponse } from '@/types/api'

export async function calculateRitual(
  body: CalculateRequest,
  token?: string | null
): Promise<CalculateResponse> {
  return request<CalculateResponse>('/api/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  })
}
