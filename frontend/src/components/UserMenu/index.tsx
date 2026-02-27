import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from 'antd'
import type { SelectProps } from 'antd'


export interface UserMenuProps {
  /** 展示用的用户名 */
  username: string
  /** 点击退出时回调 */
  onLogout: () => void
}

/** 可复用的用户菜单：头像 + 用户名 + 下拉（退出）
 *
 * 与语言/主题选择保持一致的 `Select` 外观，内部只渲染 "退出" 项。
 */
export function UserMenu({ username, onLogout }: UserMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const initial = username.charAt(0).toUpperCase()

  // 触发器显示头像+名字，使用 optionLabelProp 保持展示
  const triggerLabel = (
    <span className="flex items-center gap-2">
      <span
        className="flex items-center justify-center w-8 h-8 text-sm font-medium border rounded-full shrink-0 border-flame-gold/40 bg-flame-ink/60 text-flame-paper"
        aria-hidden
      >
        {initial}
      </span>
      <span className="max-w-[5rem] truncate text-sm font-medium sm:max-w-[6rem]">
        {username}
      </span>
    </span>
  )

  // 选择后触发登出即可
  const handleChange: SelectProps<{ value: string; label: React.ReactNode }>['onChange'] = (
    newVal
  ) => {
    if (newVal.value === 'logout') {
      onLogout()
      setOpen(false)
    }
  }

  return (
    <Select<{ value: string; label: React.ReactNode }>
      labelInValue
      placeholder={triggerLabel as any}
      defaultActiveFirstOption={false} /* 打开时不自动高亮第一项 */
      onChange={(val) => {
        handleChange(val as any)
      }}
      open={open}
      onDropdownVisibleChange={(vis) => {
        setOpen(vis)
      }}
      options={[{ value: 'logout', label: t('layout.logout') }]}
      optionLabelProp="label"
      size="small"
      className="user-menu-select !min-w-[6rem]"
      variant="borderless"
      popupMatchSelectWidth={120}
      suffixIcon={
        <span
          className={`shrink-0 text-flame-paper/50 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      }
      dropdownRender={(menu) => (
        <div className="user-menu-dropdown">{menu}</div>
      )}
    >
      {/* no children needed; placeholder 提供触发器内容 */}
    </Select>
  )
}
