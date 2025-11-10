'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás segura?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-mobile">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="confirm-dialog-body">
          <div className="confirm-icon">
            <AlertTriangle size={32} />
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9375rem' }}>
            {message}
          </p>
          
          <div className="confirm-options">
            <button
              onClick={handleConfirm}
              className="confirm-option-btn"
              style={{
                borderColor: variant === 'danger' 
                  ? 'rgba(248, 113, 113, 0.4)' 
                  : 'rgba(251, 191, 36, 0.4)'
              }}
            >
              <span className="option-emoji">⚠️</span>
              <span className="option-label">{confirmText}</span>
            </button>

            <button
              onClick={onClose}
              className="confirm-cancel"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}