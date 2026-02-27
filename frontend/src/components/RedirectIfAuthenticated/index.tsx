import { Navigate } from 'react-router-dom'
import { useAtomValue } from 'jotai'
import { authTokenAtom } from '@/store/atoms'
import { ROUTES } from '@/router'

/** 已登录则重定向到首页，用于 /login 路由 */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const token = useAtomValue(authTokenAtom)
  if (token) {
    return <Navigate to={ROUTES.HOME} replace />
  }
  return <>{children}</>
}
