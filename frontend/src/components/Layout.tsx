import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-flame-dark text-flame-paper">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-flame-ink via-flame-dark to-black/90" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(20,184,166,0.5), transparent),
                              radial-gradient(2px 2px at 40px 70px, rgba(20,184,166,0.35), transparent),
                              radial-gradient(2px 2px at 50px 160px, rgba(20,184,166,0.4), transparent),
                              radial-gradient(2px 2px at 90px 40px, rgba(20,184,166,0.3), transparent)`,
            backgroundSize: '200px 200px',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <header className="relative border-b border-flame-gold/25 py-6 text-center">
          <div className="absolute right-4 top-6 sm:right-6">
            <LanguageSwitcher />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-flame-gold sm:text-3xl">
            {t('layout.title')}
          </h1>
          <p className="mt-2 text-sm text-flame-paper/80 sm:text-base">
            {t('layout.subtitle')}
          </p>
        </header>
        <main>{children}</main>
        <footer className="border-t border-flame-gold/25 py-6 text-center text-xs text-flame-paper/60">
          {t('layout.footer')}
        </footer>
      </div>
    </div>
  )
}
