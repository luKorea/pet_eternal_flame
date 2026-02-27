/**
 * 多主题配置：一份配色 = 一份主题。扩展时在 themes.json 增加一项（含 label 兜底展示名），
 * 可选在 locales 中增加 theme.xxx 做多语言；THEME_IDS 自动从 keys 派生。
 */

import themes from './themes.json'
import type { CSSProperties } from 'react'

export type ThemeId = keyof typeof themes

export const THEME_IDS = Object.keys(themes) as ThemeId[]

const themesTyped = themes as Record<ThemeId, ThemePalette>

export type ThemePalette = {
  label?: string
  dark: string
  ink: string
  paper: string
  gold: string
  red: string
  gradientEnd: string
  antdAlgorithm: 'default' | 'dark'
}

const DEFAULT_THEME_ID: ThemeId = 'xiaohongshu'

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${n >> 16}, ${(n >> 8) & 0xff}, ${n & 0xff}`
}

export function getThemePalette(themeId: string): ThemePalette {
  const p = themesTyped[themeId as ThemeId]
  return p ?? themesTyped[DEFAULT_THEME_ID]
}

/** 主题展示名兜底：i18n 未配置 theme.xxx 时用 themes 中的 label，便于只加主题不加文案 */
export function getThemeDisplayName(themeId: string): string {
  const p = themesTyped[themeId as ThemeId]
  return (p?.label as string | undefined) ?? themeId
}

/** 用于 :root 的 CSS 变量 */
export function getThemeCssVars(palette: ThemePalette): Record<string, string> {
  const paperRgb = hexToRgb(palette.paper)
  return {
    '--theme-dark': palette.dark,
    '--theme-ink': palette.ink,
    '--theme-paper': palette.paper,
    '--theme-gold': palette.gold,
    '--theme-red': palette.red,
    '--theme-gradient-end': palette.gradientEnd,
    '--theme-paper-rgb': paperRgb,
    '--theme-error': palette.red,
  }
}

/** Ant Design token */
export function getAntdToken(palette: ThemePalette) {
  return {
    colorPrimary: palette.gold,
    colorBgContainer: palette.ink,
    colorBgElevated: palette.ink,
    colorBorder: `${palette.gold}66`,
    colorBorderSecondary: `${palette.gold}40`,
    colorText: palette.paper,
    colorTextSecondary: `${palette.paper}cc`,
    colorTextPlaceholder: `${palette.paper}80`,
    colorError: palette.red,
    colorBgSpotlight: palette.dark,
  }
}

export function getAntdAlgorithm(palette: ThemePalette): 'default' | 'dark' {
  return palette.antdAlgorithm ?? 'default'
}

/** 星点背景 style，由主色派生 */
export function getStarryBackgroundStyle(palette: ThemePalette): CSSProperties {
  const rgb = hexToRgb(palette.gold)
  return {
    backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(${rgb},0.5), transparent),
                      radial-gradient(2px 2px at 40px 70px, rgba(${rgb},0.35), transparent),
                      radial-gradient(2px 2px at 50px 160px, rgba(${rgb},0.4), transparent),
                      radial-gradient(2px 2px at 90px 40px, rgba(${rgb},0.3), transparent)`,
    backgroundSize: '200px 200px',
  }
}

/** 默认主题色板（用于首屏 fallback 或非 React 处） */
export const defaultPalette = themesTyped[DEFAULT_THEME_ID]
