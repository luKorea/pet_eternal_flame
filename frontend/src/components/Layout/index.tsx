import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtomValue, useSetAtom } from 'jotai'
import { HeaderActions } from '@/components/HeaderActions'
import { useThemePalette, getStarryBackgroundStyle } from '@/theme'
import { authTokenAtom, userAtom, AUTH_TOKEN_KEY } from '@/store/atoms'
import { ROUTES } from '@/router'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const palette = useThemePalette()
  const token = useAtomValue(authTokenAtom)
  const user = useAtomValue(userAtom)
  const setToken = useSetAtom(authTokenAtom)
  const setUser = useSetAtom(userAtom)

  const logout = () => {
    setToken(null)
    setUser(null)
    if (typeof localStorage !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY)
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen bg-flame-dark text-flame-paper">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-flame-ink via-flame-dark to-flame-gradientEnd" />
        <div
          className="absolute inset-0 opacity-25"
          style={getStarryBackgroundStyle(palette)}
        />
        <div
          className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-flame-gold/10 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between border-b border-flame-gold/25 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 rounded-full bg-flame-gold px-4 py-1.5 text-sm font-semibold text-white sm:px-5 sm:py-2 sm:text-base">
              {t('layout.title')}
            </span>
            <p className="truncate text-sm text-flame-paper/80 sm:text-base">
              {t('layout.subtitle')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <HeaderActions user={token && user ? user : null} onLogout={logout} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-flame-gold/25 py-6 text-center text-xs text-flame-paper/60">
          {t('layout.footer')}
        </footer>
      </div>
    </div>
  )
}
