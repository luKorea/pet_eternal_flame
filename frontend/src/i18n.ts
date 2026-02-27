import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import localeConfig from '@/locales/config.json'

const STORAGE_KEY = 'pet-eternal-flame-lang'

/** 语言注册表：仅在此增加条目 + 新增对应 locales/config.json 条目，即可扩展语言 */
export type Locale = keyof typeof localeConfig
export const supportedLngs = Object.keys(localeConfig) as Locale[]
export const localeDisplayName = Object.fromEntries(
  Object.entries(localeConfig).map(([code, meta]) => [code, (meta as { displayName: string }).displayName])
) as Record<Locale, string>

export const defaultNS = 'translation'

/** 从 i18n 语言码得到发给后端的 locale（BCP 47 主语言，便于后续加 ja/ko 等） */
export function getApiLocale(lang: string): string {
  const primary = (lang || '').trim().split('-')[0].toLowerCase()
  return primary || 'zh'
}

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const initial: Locale = supportedLngs.includes((saved as Locale) ?? '') ? (saved as Locale) : 'zh'

i18n.use(initReactI18next).init({
  lng: initial,
  fallbackLng: 'zh',
  defaultNS,
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false,
  },
})

export async function loadRemoteLocaleResources(lng: Locale) {
  try {
    const apiLocale = getApiLocale(lng)
    const res = await fetch(`/api/language-strings?locale=${apiLocale}`)
    if (!res.ok) return
    const data = await res.json()
    i18n.addResourceBundle(lng, defaultNS, data, true, true)
  } catch {
    // 静默失败，继续使用已有资源
  }
}


export const i18nReady = loadRemoteLocaleResources(initial);

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lng)
})

export async function setLocale(lng: Locale) {
  await loadRemoteLocaleResources(lng)
  i18n.changeLanguage(lng)
}

export default i18n
