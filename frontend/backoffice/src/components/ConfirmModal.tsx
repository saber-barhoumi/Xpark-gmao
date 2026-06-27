import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Modal } from 'react-bootstrap'

interface ConfirmModalProps {
  show: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

const VARIANTS = {
  danger: {
    icon: 'solar:danger-triangle-bold-duotone',
    iconColor: '#dc3545',
    iconBg: '#fff0f0',
    btnClass: 'btn-danger',
  },
  warning: {
    icon: 'solar:shield-warning-line-duotone',
    iconColor: '#f59e0b',
    iconBg: '#fffbeb',
    btnClass: 'btn-warning',
  },
}

const ConfirmModal = ({
  show,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const v = VARIANTS[variant]

  return (
    <Modal show={show} onHide={onCancel} centered size="sm" backdrop="static">
      <Modal.Body style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: v.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <IconifyIcon icon={v.icon} style={{ fontSize: 32, color: v.iconColor }} />
        </div>

        {/* Title */}
        <h5 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#111' }}>
          {title}
        </h5>

        {/* Message */}
        <p style={{ color: '#6c757d', fontSize: 14, margin: '0 0 24px' }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            className="btn btn-light"
            style={{ minWidth: 100, fontWeight: 600 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${v.btnClass}`}
            style={{ minWidth: 100, fontWeight: 600 }}
          >
            {confirmLabel}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ConfirmModal
