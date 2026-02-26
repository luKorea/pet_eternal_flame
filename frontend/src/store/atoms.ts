import { atom } from 'jotai'
import type { CalculateResponse, User } from '@/types/api'

// ----- 表单与结果（祭祀计算） -----
export const deathDateAtom = atom<string>('')
export const petNameAtom = atom<string>('')
export const resultAtom = atom<CalculateResponse | null>(null)
export const errorAtom = atom<string | null>(null)
/** 上次提交的参数，用于 SWR key：切换语言时随 key 变化自动重新请求并更新结果 */
export const lastSubmittedParamsAtom = atom<{ deathDate: string; petName?: string } | null>(null)

// ----- 鉴权（后续登录扩展） -----
export const authTokenAtom = atom<string | null>(null)
export const userAtom = atom<User | null>(null)
export const isAuthenticatedAtom = atom((get) => !!get(authTokenAtom))
