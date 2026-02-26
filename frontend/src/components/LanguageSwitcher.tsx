import { useTranslation } from 'react-i18next'
import { setLocale, supportedLngs, localeDisplayName } from '@/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-2 text-sm text-flame-paper/80">
      {supportedLngs.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => setLocale(lng)}
          className={
            i18n.language === lng
              ? 'font-medium text-flame-gold underline-offset-2 hover:text-flame-gold'
              : 'hover:text-flame-paper'
          }
          aria-pressed={i18n.language === lng}
        >
          {localeDisplayName[lng]}
        </button>
      ))}
    </div>
  )
}
