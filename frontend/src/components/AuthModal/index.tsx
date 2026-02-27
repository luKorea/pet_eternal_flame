import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { AuthForm } from '@/components/AuthForm'

type AuthMode = 'login' | 'register'

interface AuthModalProps {
  open: boolean
  mode: AuthMode
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, mode, onClose, onSuccess }: AuthModalProps) {
  const { t } = useTranslation()

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={mode === 'login' ? t('auth.login') : t('auth.register')}
      destroyOnClose
      width={400}
      styles={{ body: { paddingTop: 16 } }}
      className="[&_.ant-modal-content]:bg-flame-ink [&_.ant-modal-header]:bg-flame-ink [&_.ant-modal-title]:text-flame-gold"
    >
      <AuthForm mode={mode} onSuccess={handleSuccess} onCancel={onClose} />
    </Modal>
  )
}
