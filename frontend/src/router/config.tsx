import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { Protected } from '@/components/Protected'
import { RedirectIfAuthenticated } from '@/components/RedirectIfAuthenticated'
import { ROUTES } from './constants'

/**
 * 路由配置（RouteObject[]）
 * 扩展：在 constants 增加 path，在此增加一条配置
 */
export const routeConfig: RouteObject[] = [
  {
    path: ROUTES.LOGIN,
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: ROUTES.HOME,
    element: (
      <Protected>
        <HomePage />
      </Protected>
    ),
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]
