'use client'

import { AlertTriangle, Trash2, XCircle } from 'lucide-react'
import { DialogBase } from '@/components/ui/dialog-base'

type ConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    default: XCircle,
  }
  const Icon = icons[variant]

  const footerButtons = (
    <>
      <button
        onClick={onClose}
        className="btn-ghost"
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        className={`btn-${variant === 'danger' ? 'danger' : 'primary'}`}
        disabled={isLoading}
      >
        {isLoading ? 'Procesando...' : confirmText}
      </button>
    </>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton={false}
      footer={footerButtons}
    >
      <div className="confirm-modal-body">
        <div className={`confirm-modal-icon confirm-modal-icon-${variant}`}>
          <Icon />
        </div>
      </div>
    </DialogBase>
  )
}
