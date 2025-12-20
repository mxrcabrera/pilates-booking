'use client'

import { AlertTriangle, Trash2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false}>
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon confirm-modal-icon-${variant}`}>
            <Icon />
          </div>

          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="confirm-modal-actions">
            <button
              onClick={onClose}
              className="btn-ghost"
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`btn-${variant === 'danger' ? 'danger' : 'primary'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
