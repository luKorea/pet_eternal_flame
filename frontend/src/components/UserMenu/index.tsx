import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'

/** 退出图标（箭头离开方框） */
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export interface UserMenuProps {
  /** 展示用的用户名 */
  username: string
  /** 点击退出时回调 */
  onLogout: () => void
}

/** 可复用的用户菜单：头像 + 用户名 + 下拉（退出） */
export function UserMenu({ username, onLogout }: UserMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      label: (
        <span className="flex items-center gap-2">
          <LogoutIcon className="shrink-0 text-current opacity-70" />
          {t('layout.logout')}
        </span>
      ),
      onClick: () => {
        onLogout()
        setOpen(false)
      },
    },
  ]

  const initial = username.charAt(0).toUpperCase()

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <button
        type="button"
        className="user-menu-trigger flex items-center gap-2 rounded-lg py-1.5 pr-2 pl-1.5 text-flame-paper/95 transition-colors hover:bg-flame-ink/40 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-flame-gold/40 bg-flame-ink/60 text-sm font-medium text-flame-paper"
          aria-hidden
        >
          {initial}
        </span>
        <span className="max-w-[5rem] truncate text-sm font-medium sm:max-w-[6rem]">{username}</span>
        <span
          className={`shrink-0 text-flame-paper/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
    </Dropdown>
  )
}
