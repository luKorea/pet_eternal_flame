import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { UserMenu } from '@/components/UserMenu'

export interface HeaderActionsProps {
  /** 已登录用户信息，不传则只展示语言+主题 */
  user?: { username: string } | null
  /** 用户点击退出时回调，与 user 同时使用 */
  onLogout?: () => void
}

/** 可复用的头部右侧操作区：语言 + 主题 + 可选用户菜单 */
export function HeaderActions({ user, onLogout }: HeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <LanguageSwitcher />
      <ThemeSwitcher />
      {user && onLogout && <UserMenu username={user.username} onLogout={onLogout} />}
    </div>
  )
}
