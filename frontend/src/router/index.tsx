import { RouterProvider } from 'react-router-dom'
import { router } from './router-instance'

/**
 * 路由容器，在 App 中鉴权就绪后挂载
 */
export function AppRouter() {
  return <RouterProvider router={router} />
}

export { router } from './router-instance'
export { ROUTES } from './constants'
export type { RoutePath } from './constants'
