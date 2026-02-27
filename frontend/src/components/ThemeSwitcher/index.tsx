import { useTranslation } from 'react-i18next'
import { useSetAtom, useAtomValue } from 'jotai'
import { Select } from 'antd'
import { themeIdAtom } from '@/store/atoms'
import { THEME_IDS, getThemeDisplayName } from '@/theme'
import type { ThemeId } from '@/theme'

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const themeId = useAtomValue(themeIdAtom)
  const setThemeId = useSetAtom(themeIdAtom)

  const options = THEME_IDS.map((id) => {
    const i18nKey = `theme.${id}`
    const label = t(i18nKey) !== i18nKey ? t(i18nKey) : getThemeDisplayName(id)
    return { label, value: id }
  })

  return (
    <Select<ThemeId>
      value={themeId}
      onChange={(v) => v && setThemeId(v)}
      options={options}
      size="small"
      className="!min-w-[5rem]"
      variant="borderless"
      popupMatchSelectWidth={120}
      aria-label={t('theme.label')}
    />
  )
}
