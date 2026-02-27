export interface BurningDateItem {
  date: string
  desc: string
}

export interface CalculateResponse {
  petMonths: number
  deathDate: string
  petName: string
  suggestedQuantity: number
  burningDates: BurningDateItem[]
  explanation: string
}

export interface CalculateRequest {
  deathDate: string
  petName?: string
  /** 语言：zh | en，后端据此返回/翻译 explanation 与 burningDates[].desc */
  locale?: string
}

/** 后续登录扩展用 */
export interface User {
  id: string
  username: string
}

export interface LoginRequest {
  username: string
  password: string
  locale?: string
}

export interface LoginResponse {
  token: string
  user: User
}
