import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { useTranslation } from 'react-i18next'
import { useAtomValue } from 'jotai'
import { getApiLocale } from '@/i18n'
import {
  getThemePalette,
  getThemeCssVars,
  getAntdToken,
  getAntdAlgorithm,
} from '@/theme/constants'
import { themeIdAtom } from '@/store/atoms'

const antdLocales = {
  zh: zhCN,
  en: enUS,
} as const

const dayjsLocales: Record<string, string> = {
  zh: 'zh-cn',
  en: 'en',
}

interface AntdProviderProps {
  children: ReactNode
}

export function AntdProvider({ children }: AntdProviderProps) {
  const { i18n } = useTranslation()
  const themeId = useAtomValue(themeIdAtom)
  const palette = getThemePalette(themeId)
  const localeKey = getApiLocale(i18n.language)
  const antdLocale = antdLocales[localeKey as keyof typeof antdLocales] ?? zhCN
  const dayjsLocale = dayjsLocales[localeKey] ?? 'zh-cn'

  useEffect(() => {
    dayjs.locale(dayjsLocale)
  }, [dayjsLocale])

  const themeCssVars = getThemeCssVars(palette)
  const themeCssString = `:root{${Object.entries(themeCssVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`

  const antdToken = getAntdToken(palette)
  const algorithm =
    getAntdAlgorithm(palette) === 'dark'
      ? antdTheme.darkAlgorithm
      : antdTheme.defaultAlgorithm

  const theme: ThemeConfig = {
    algorithm,
    token: {
      ...antdToken,
      borderRadius: 6,
    },
    components: {
      DatePicker: {
        cellHoverBg: `${antdToken.colorPrimary}20`,
        cellActiveWithRangeBg: `${antdToken.colorPrimary}30`,
      },
      Input: {
        colorBgContainer: antdToken.colorBgContainer,
        colorBorder: antdToken.colorBorder,
        colorText: antdToken.colorText,
        colorTextPlaceholder: antdToken.colorTextPlaceholder,
        activeBorderColor: antdToken.colorPrimary,
        hoverBorderColor: antdToken.colorPrimary,
      },
    },
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssString }} />
      <ConfigProvider locale={antdLocale} theme={theme}>
        {children}
      </ConfigProvider>
    </>
  )
}
