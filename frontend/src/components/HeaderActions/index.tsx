import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { UserMenu } from '@/components/UserMenu'

export interface HeaderActionsProps {
  /** 已登录用户信息，不传则只展示语言+主题 */
  user?: { username: string } | null
  /** 用户点击退出时回调，与 user 同时使用 */
  onLogout?: () => void
  /** 移动端抽屉内使用垂直排列 */
  variant?: 'row' | 'stack'
}

/** 可复用的头部右侧操作区：语言 + 主题 + 可选用户菜单 */
export function HeaderActions({ user, onLogout, variant = 'row' }: HeaderActionsProps) {
  const { t } = useTranslation()
  const isStack = variant === 'stack'
  return (
    <div
      className={
        isStack
          ? 'header-actions-stack flex flex-col items-stretch gap-4 py-2'
          : 'flex shrink-0 items-center gap-2 sm:gap-3'
      }
    >
      {isStack ? (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-flame-paper/60">
              {t('layout.language')}
            </span>
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-flame-paper/60">
              {t('layout.theme')}
            </span>
            <ThemeSwitcher />
          </div>
          {user && onLogout && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-flame-paper/60">
                {t('layout.account')}
              </span>
              <UserMenu username={user.username} onLogout={onLogout} />
            </div>
          )}
        </>
      ) : (
        <>
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user && onLogout && <UserMenu username={user.username} onLogout={onLogout} />}
        </>
      )}
    </div>
  )
}
