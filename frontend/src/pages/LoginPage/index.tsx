import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeaderActions } from '@/components/HeaderActions'
import { AuthForm } from '@/components/AuthForm'
import { RedirectIfAuthenticated } from '@/components/RedirectIfAuthenticated'
import { useThemePalette, getStarryBackgroundStyle } from '@/theme'
import { useAtomValue } from 'jotai'
import { themeIdAtom } from '@/store/atoms'
import { ROUTES } from '@/router'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const palette = useThemePalette()
  const themeId = useAtomValue(themeIdAtom)
  const isXiaohongshu = themeId === 'xiaohongshu'
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <RedirectIfAuthenticated>
      <div
        className="min-h-screen text-flame-paper"
        style={
          isXiaohongshu
            ? {
                background:
                  'radial-gradient(120% 160% at 10% 20%, #ffe9f0 0%, #fff8f8 35%, #f2f6ff 70%, #ffffff 100%)',
              }
            : undefined
        }
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

        <div className="relative z-10 flex min-h-screen flex-col">
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
            <HeaderActions />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <p className="mb-6 text-center text-flame-paper/90">
            {t('auth.loginRequired')}
          </p>
          <section className="w-full max-w-sm rounded-lg border border-flame-gold/30 bg-flame-ink/50 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-flame-gold">
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </h2>
            <AuthForm
              mode={mode}
              onModeChange={setMode}
              onSuccess={() => navigate(ROUTES.HOME, { replace: true })}
            />
          </section>
        </main>

        <footer className="border-t border-flame-gold/25 py-4 text-center text-xs text-flame-paper/60">
          {t('layout.footer')}
        </footer>
        </div>
      </div>
    </RedirectIfAuthenticated>
  )
}
