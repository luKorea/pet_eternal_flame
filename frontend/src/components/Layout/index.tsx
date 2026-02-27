import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtomValue, useSetAtom } from 'jotai'
import { HeaderActions } from '@/components/HeaderActions'
import { useThemePalette, getStarryBackgroundStyle } from '@/theme'
import { authTokenAtom, userAtom, themeIdAtom, AUTH_TOKEN_KEY } from '@/store/atoms'
import { ROUTES } from '@/router'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const palette = useThemePalette()
  const themeId = useAtomValue(themeIdAtom)
  const token = useAtomValue(authTokenAtom)
  const user = useAtomValue(userAtom)
  const setToken = useSetAtom(authTokenAtom)
  const setUser = useSetAtom(userAtom)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logout = () => {
    setToken(null)
    setUser(null)
    if (typeof localStorage !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY)
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const headerUser = token && user ? user : null
  const isXiaohongshu = themeId === 'xiaohongshu'
  const xiaohongshuBg =
    'radial-gradient(120% 160% at 10% 20%, #ffe9f0 0%, #fff8f8 35%, #f2f6ff 70%, #ffffff 100%)'

  return (
    <div
      className={`min-h-screen text-flame-paper ${!isXiaohongshu ? 'bg-flame-dark' : ''}`}
      style={isXiaohongshu ? { background: xiaohongshuBg } : undefined}
    >
      {!isXiaohongshu && (
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
      )}
      {isXiaohongshu && (
        <div
          className="fixed inset-0 -z-10"
          aria-hidden
          style={{ background: xiaohongshuBg }}
        />
      )}

      <div className="relative z-10">
        <header className="flex items-center justify-between gap-3 border-b border-flame-gold/25 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="shrink-0 rounded-full bg-flame-gold px-3 py-1.5 text-sm font-semibold text-white sm:px-5 sm:py-2 sm:text-base">
              {t('layout.title')}
            </span>
            <p className="hidden truncate text-sm text-flame-paper/80 sm:block sm:text-base">
              {t('layout.subtitle')}
            </p>
          </div>
          {/* 桌面端：右侧操作区 */}
          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
            <HeaderActions user={headerUser} onLogout={logout} />
          </div>
          {/* 移动端：汉堡菜单 */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-flame-gold/40 text-flame-paper hover:bg-flame-gold/10 md:hidden"
            aria-label={t('layout.menu')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* 移动端抽屉遮罩 + 抽屉 */}
        {mobileMenuOpen && (
          <>
            <div
              className="mobile-drawer-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
              aria-hidden
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="mobile-drawer fixed right-0 top-0 z-50 flex h-full w-[min(100vw-3rem,280px)] flex-col border-l border-flame-gold/30 bg-flame-dark shadow-[-8px_0_24px_rgba(0,0,0,0.4)] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('layout.menu')}
            >
              <div className="flex items-center justify-between border-b border-flame-gold/20 px-4 py-3.5">
                <span className="text-sm font-medium tracking-wide text-flame-paper/95">
                  {t('layout.menu')}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-flame-paper/70 transition-colors hover:bg-flame-gold/15 hover:text-flame-paper"
                  aria-label={t('layout.close')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto px-4 py-5">
                <HeaderActions user={headerUser} onLogout={logout} variant="stack" />
              </div>
            </div>
          </>
        )}

        <main>{children}</main>
        <footer className="border-t border-flame-gold/25 py-4 text-center text-xs text-flame-paper/60 sm:py-6">
          {t('layout.footer')}
        </footer>
      </div>
    </div>
  )
}
