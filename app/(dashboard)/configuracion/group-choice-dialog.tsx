'use client'

import { useState } from 'react'
import { Layers, Calendar, ChevronLeft } from 'lucide-react'
import { DialogBase } from '@/components/ui/dialog-base'
import { DIAS_SEMANA_COMPLETO } from '@/lib/constants'

interface HorarioSimplificado {
  id: string
  diaSemana: number
}

type GroupChoiceDialogProps = {
  isOpen: boolean
  onClose: () => void
  onChoice: (choice: 'batch' | 'single', dayId?: string) => void
  groupLabel: string
  horarios: HorarioSimplificado[]
}

export function GroupChoiceDialog({
  isOpen,
  onClose,
  onChoice,
  groupLabel,
  horarios
}: GroupChoiceDialogProps) {
  const [step, setStep] = useState<'choice' | 'day-picker'>('choice')

  const handleClose = () => {
    setStep('choice')
    onClose()
  }

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Horario Grupal"
      description={`Este horario forma parte de un grupo (${groupLabel})`}
      size="sm"
      showCloseButton={false}
    >
      <div className="confirm-dialog-body">
        {step === 'choice' ? (
          <>
            <div className="confirm-options">
              <button
                onClick={() => onChoice('batch')}
                className="confirm-option-btn"
                style={{ borderLeft: '3px solid #6366f1' }}
              >
                <span className="option-emoji"><Layers size={20} className="text-indigo-400" /></span>
                <div className="flex flex-col items-start text-left">
                  <span className="option-label" style={{ fontWeight: 600 }}>Modificar TODO el lote</span>
                  <span className="text-[11px] opacity-40">Se actualizarán los {horarios.length} días del grupo</span>
                </div>
              </button>

              <button
                onClick={() => setStep('day-picker')}
                className="confirm-option-btn"
              >
                <span className="option-emoji"><Calendar size={20} /></span>
                <div className="flex flex-col items-start text-left">
                  <span className="option-label">Modificar UN SOLO día</span>
                  <span className="text-[11px] opacity-40">Separar un día específico del grupo</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="confirm-options">
              <p className="text-[13px] text-white/40 mb-4 px-1">¿Qué día querés editar por separado?</p>
              <div className="grid grid-cols-1 gap-2">
                {horarios.map(h => (
                  <button
                    key={h.id}
                    onClick={() => onChoice('single', h.id)}
                    className="choice-day-btn"
                  >
                    <span className="choice-day-label">{DIAS_SEMANA_COMPLETO[h.diaSemana].charAt(0).toUpperCase() + DIAS_SEMANA_COMPLETO[h.diaSemana].slice(1)}</span>
                    <span className="text-[10px] opacity-30 font-mono tracking-tighter">EDITAR INDIVIDUAL</span>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setStep('choice')}
                className="flex items-center gap-1.5 text-[11px] text-indigo-400/60 hover:text-indigo-400 transition-colors mt-6 py-2 px-1 rounded-md hover:bg-white/[0.02] w-fit"
              >
                <ChevronLeft size={12} />
                Regresar a las opciones
              </button>
            </div>
          </>
        )}

        <button onClick={handleClose} className="confirm-cancel" style={{ marginTop: step === 'day-picker' ? '1rem' : '1.5rem' }}>
          Cancelar
        </button>
      </div>

      <style jsx>{`
        .choice-day-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9375rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }

        .choice-day-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          color: white;
        }

        .choice-day-btn:active {
          transform: scale(0.98);
        }

        .choice-day-label {
          font-weight: 500;
        }
      `}</style>
    </DialogBase>
  )
}
