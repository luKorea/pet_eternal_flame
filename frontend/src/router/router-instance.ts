import { createBrowserRouter } from 'react-router-dom'
import { routeConfig } from './config'

/**
 * 合并 C 端路由与管理员路由
 * /admin/* 对应管理员路由
 * /* 对应 C 端路由
 */
export const router = createBrowserRouter([
  ...routeConfig,
])
