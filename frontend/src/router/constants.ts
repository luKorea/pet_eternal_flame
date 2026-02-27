/**
 * 路由路径常量
 * 用于 navigate、Link、重定向等，扩展新页面时在此追加
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
