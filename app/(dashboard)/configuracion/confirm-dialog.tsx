'use client'

import { AlertTriangle, Check, Sunrise, X } from 'lucide-react'
import { DialogBase } from '@/components/ui/dialog-base'
import type { LucideIcon } from 'lucide-react'

type ConfirmOption = {
  value: string
  label: string
  icon: LucideIcon
}

type ConfirmDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (option: 'incluir' | 'excluir') => void
  tipo: 'sabado-tarde' | 'domingo'
}

const CONFIG: Record<ConfirmDialogProps['tipo'], { title: string; description: string; options: ConfirmOption[] }> = {
  'sabado-tarde': {
    title: '¿Trabajás los sábados por la tarde?',
    description: 'Elegiste agregar sábados. ¿Querés incluir las tardes?',
    options: [
      { value: 'incluir', label: 'Sí, incluir sábados tarde', icon: Check },
      { value: 'excluir', label: 'No, solo sábados mañana', icon: Sunrise },
    ]
  },
  'domingo': {
    title: '¿Trabajás los domingos?',
    description: 'Es poco común trabajar domingos. ¿Estás segura?',
    options: [
      { value: 'incluir', label: 'Sí, agregar domingos', icon: Check },
      { value: 'excluir', label: 'No, mejor no', icon: X },
    ]
  }
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, tipo }: ConfirmDialogProps) {
  const current = CONFIG[tipo]

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={current.title}
      description={current.description}
      size="sm"
      showCloseButton={false}
    >
      <div className="confirm-dialog-body">
        <div className="confirm-icon">
          <AlertTriangle size={48} />
        </div>

        <div className="confirm-options">
          {current.options.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => onConfirm(option.value as 'incluir' | 'excluir')}
                className="confirm-option-btn"
              >
                <span className="option-emoji"><Icon size={20} /></span>
                <span className="option-label">{option.label}</span>
              </button>
            )
          })}
        </div>

        <button onClick={onClose} className="confirm-cancel">
          Cancelar
        </button>
      </div>
    </DialogBase>
  )
}
