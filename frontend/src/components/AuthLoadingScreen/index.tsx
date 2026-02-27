import { useTranslation } from 'react-i18next'

/** 鉴权未就绪时全屏加载，避免登录页闪现 */
export function AuthLoadingScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-flame-dark text-flame-paper">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-flame-gold border-t-transparent" />
        <p className="mt-4 text-sm text-flame-paper/80">{t('auth.loading')}</p>
      </div>
    </div>
  )
}
