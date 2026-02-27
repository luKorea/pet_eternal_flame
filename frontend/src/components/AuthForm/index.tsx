import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useSetAtom } from 'jotai'
import { authTokenAtom, userAtom, AUTH_TOKEN_KEY } from '@/store/atoms'
import { login, register } from '@/api/endpoints/auth'

type Mode = 'login' | 'register'

interface AuthFormProps {
  mode: Mode
  onSuccess?: () => void
  onCancel?: () => void
  /** 切换登录/注册时通知父组件（如登录页标题） */
  onModeChange?: (mode: Mode) => void
}

export function AuthForm({ mode: initialMode, onSuccess, onCancel, onModeChange }: AuthFormProps) {
  const { t } = useTranslation()
  const setToken = useSetAtom(authTokenAtom)
  const setUser = useSetAtom(userAtom)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const body = { username: values.username.trim(), password: values.password }
      const res = mode === 'login' ? await login(body) : await register(body)
      setToken(res.token)
      setUser(res.user)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, res.token)
      }
      message.success(mode === 'login' ? t('auth.loginSuccess') : t('auth.registerSuccess'))
      onSuccess?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      message.error(msg.startsWith('error.') ? t(msg as 'error.requestFailed') : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={submit}>
      <Form.Item
        name="username"
        label={t('auth.username')}
        rules={[{ required: true, message: t('auth.usernamePlaceholder') }]}
      >
        <Input placeholder={t('auth.usernamePlaceholder')} autoComplete="username" />
      </Form.Item>
      <Form.Item
        name="password"
        label={t('auth.password')}
        rules={[{ required: true, message: t('auth.passwordPlaceholder') }]}
      >
        <Input.Password placeholder={t('auth.passwordPlaceholder')} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
      </Form.Item>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="primary" htmlType="submit" loading={loading} className="!bg-flame-gold hover:!bg-flame-gold/90 !border-0">
          {mode === 'login' ? t('auth.login') : t('auth.register')}
        </Button>
        {onCancel && (
          <Button onClick={onCancel}>{t('auth.cancel')}</Button>
        )}
        <Button
          type="link"
          className="!text-flame-gold !px-0"
          onClick={() => {
            const next = mode === 'login' ? 'register' : 'login'
            setMode(next)
            form.resetFields()
            onModeChange?.(next)
          }}
        >
          {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
        </Button>
      </div>
    </Form>
  )
}
