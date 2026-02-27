import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { CalculateResponse, User } from '@/types/api'
import type { ThemeId } from '@/theme/constants'

export const AUTH_TOKEN_KEY = 'pet-eternal-flame-token'
export const THEME_STORAGE_KEY = 'pet-eternal-flame-theme'

// ----- 主题 -----
export const themeIdAtom = atomWithStorage<ThemeId>(THEME_STORAGE_KEY, 'light')

// ----- 表单与结果（祭祀计算） -----
export const deathDateAtom = atom<string>('')
export const petNameAtom = atom<string>('')
export const resultAtom = atom<CalculateResponse | null>(null)
export const errorAtom = atom<string | null>(null)
/** 上次提交的参数，用于 SWR key：切换语言时随 key 变化自动重新请求并更新结果 */
export const lastSubmittedParamsAtom = atom<{ deathDate: string; petName?: string } | null>(null)

// ----- 鉴权 -----
export const authTokenAtom = atom<string | null>(null)
export const userAtom = atom<User | null>(null)
export const isAuthenticatedAtom = atom((get) => !!get(authTokenAtom))
/** 是否已完成鉴权恢复（读 localStorage / getMe），未完成前不渲染路由避免登录页闪现 */
export const authReadyAtom = atom<boolean>(false)
