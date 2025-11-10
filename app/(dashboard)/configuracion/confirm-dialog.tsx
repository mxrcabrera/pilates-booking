'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (option: 'incluir' | 'excluir') => void
  tipo: 'sabado-tarde' | 'domingo'
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, tipo }: ConfirmDialogProps) {
  const config = {
    'sabado-tarde': {
      title: '¿Trabajás los sábados por la tarde?',
      description: 'Elegiste agregar sábados. ¿Querés incluir las tardes?',
      options: [
        { value: 'incluir', label: 'Sí, incluir sábados tarde', emoji: '✅' },
        { value: 'excluir', label: 'No, solo sábados mañana', emoji: '🌅' },
      ]
    },
    'domingo': {
      title: '¿Trabajás los domingos?',
      description: 'Es poco común trabajar domingos. ¿Estás segura?',
      options: [
        { value: 'incluir', label: 'Sí, agregar domingos', emoji: '✅' },
        { value: 'excluir', label: 'No, mejor no', emoji: '❌' },
      ]
    }
  }

  const current = config[tipo]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false}>
        <div className="confirm-dialog-body">
          <div className="confirm-icon">
            <AlertTriangle size={48} />
          </div>

          <DialogHeader>
            <DialogTitle>{current.title}</DialogTitle>
            <DialogDescription>{current.description}</DialogDescription>
          </DialogHeader>

          <div className="confirm-options">
            {current.options.map(option => (
              <button
                key={option.value}
                onClick={() => onConfirm(option.value as 'incluir' | 'excluir')}
                className="confirm-option-btn"
              >
                <span className="option-emoji">{option.emoji}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>

          <button onClick={onClose} className="confirm-cancel">
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}