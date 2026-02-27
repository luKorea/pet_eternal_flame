import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAtomValue } from 'jotai'
import { authTokenAtom } from '@/store/atoms'
import { ROUTES } from '@/router'

interface ProtectedProps {
  children: ReactNode
}

/** 已登录才渲染子组件，否则重定向到 /login */
export function Protected({ children }: ProtectedProps) {
  const token = useAtomValue(authTokenAtom)
  const location = useLocation()

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }
  return <>{children}</>
}
