import { useTranslation } from 'react-i18next'
import { Select } from 'antd'
import { setLocale, supportedLngs, localeDisplayName } from '@/i18n'
import type { Locale } from '@/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const value: Locale = (supportedLngs as readonly string[]).includes(i18n.language) ? (i18n.language as Locale) : supportedLngs[0]

  return (
    <Select<Locale>
      value={value}
      onChange={(v) => v && setLocale(v)}
      options={supportedLngs.map((lng) => ({ label: localeDisplayName[lng], value: lng }))}
      size="small"
      className="!min-w-[4.5rem]"
      variant="borderless"
      popupMatchSelectWidth={120}
      aria-label="Language"
    />
  )
}
