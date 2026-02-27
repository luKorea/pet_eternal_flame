import { useAtomValue } from 'jotai'
import { themeIdAtom } from '@/store/atoms'
import { getThemePalette } from './constants'
import type { ThemePalette } from './constants'

export function useThemePalette(): ThemePalette {
  const themeId = useAtomValue(themeIdAtom)
  return getThemePalette(themeId)
}
