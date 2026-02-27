import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { authTokenAtom, userAtom, authReadyAtom, AUTH_TOKEN_KEY } from '@/store/atoms'
import { getMe } from '@/api/endpoints/auth'

/** 应用启动时从 localStorage 恢复 token，并请求 /api/auth/me 恢复用户信息；完成后设置 authReady 避免登录页闪现 */
export function useAuthInit() {
  const setToken = useSetAtom(authTokenAtom)
  const setUser = useSetAtom(userAtom)
  const setAuthReady = useSetAtom(authReadyAtom)

  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    if (!saved) {
      setAuthReady(true)
      return
    }
    setToken(saved)
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        setToken(null)
        setUser(null)
        if (typeof localStorage !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY)
      })
      .finally(() => setAuthReady(true))
  }, [setToken, setUser, setAuthReady])
}
