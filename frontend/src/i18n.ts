import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from '@/locales/zh.json'
import en from '@/locales/en.json'

const STORAGE_KEY = 'pet-eternal-flame-lang'

export const defaultNS = 'translation'
export const resources = {
  zh: { translation: zh },
  en: { translation: en },
} as const

/** 当前支持的前端语言，扩展时在此与 resources、localeDisplayName 中增加即可 */
export const supportedLngs = ['zh', 'en'] as const
export type Locale = (typeof supportedLngs)[number]

/** 语言切换器展示名，扩展语言时在此补充 */
export const localeDisplayName: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
}

/** 从 i18n 语言码得到发给后端的 locale（BCP 47 取主语言，便于后续加 ja/ko 等） */
export function getApiLocale(lang: string): string {
  const primary = (lang || '').trim().split('-')[0].toLowerCase()
  return primary || 'zh'
}

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const initial: Locale = (supportedLngs as readonly string[]).includes(saved || '') ? (saved as Locale) : 'zh'

i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: 'zh',
  defaultNS,
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lng)
})

export function setLocale(lng: Locale) {
  i18n.changeLanguage(lng)
}

export default i18n
