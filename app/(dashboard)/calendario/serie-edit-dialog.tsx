'use client'

import { useState } from 'react'
import { editSeriesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { DialogBase } from '@/components/ui/dialog-base'
import { getErrorMessage } from '@/lib/utils'
import type { Clase } from '@/lib/types'
import { DIAS_SEMANA_OPTIONS } from '@/lib/constants'

type Scope = 'future' | 'all_unattended'

export function SerieEditDialog({
  isOpen,
  onClose,
  clase,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  onSuccess: () => void
}) {
  const { showSuccess, showError } = useToast()
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])
  const [horaInicio, setHoraInicio] = useState('')
  const [scope, setScope] = useState<Scope>('future')
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize state when dialog opens with a new clase
  if (isOpen && clase && !initialized) {
    setDiasSeleccionados([...clase.diasSemana])
    setHoraInicio(clase.horaRecurrente || clase.horaInicio)
    setScope('future')
    setInitialized(true)
  }

  // Reset when dialog closes
  if (!isOpen && initialized) {
    setInitialized(false)
  }

  if (!clase || !clase.serieId) return null

  const handleDiaToggle = (dia: number) => {
    setDiasSeleccionados(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  const handleSubmit = async () => {
    if (diasSeleccionados.length === 0) {
      showError('Selecciona al menos un día')
      return
    }

    setIsLoading(true)
    try {
      const result = await editSeriesAPI({
        serieId: clase.serieId!,
        diasSemana: diasSeleccionados,
        horaInicio,
        scope
      })
      showSuccess(`Serie actualizada (${result.updated} clases)`)
      onSuccess()
      onClose()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges =
    horaInicio !== (clase.horaRecurrente || clase.horaInicio) ||
    JSON.stringify([...diasSeleccionados].sort()) !== JSON.stringify([...clase.diasSemana].sort())

  const footer = (
    <>
      <button onClick={onClose} className="btn-ghost" disabled={isLoading}>
        Cancelar
      </button>
      <button
        onClick={handleSubmit}
        className="btn-primary"
        disabled={isLoading || !hasChanges || diasSeleccionados.length === 0}
      >
        {isLoading ? 'Actualizando...' : 'Actualizar serie'}
      </button>
    </>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title="Editar serie"
      footer={footer}
    >
      <div className="serie-edit-content">
        <div className="detail-item">
          <span className="detail-label">Alumno</span>
          <span className="detail-value">{clase.alumno?.nombre || 'Sin asignar'}</span>
        </div>

        <div className="form-group">
          <label htmlFor="serie-hora">Horario</label>
          <input
            id="serie-hora"
            type="time"
            value={horaInicio}
            onChange={e => setHoraInicio(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Días de clase</label>
          <div className="dias-grid compact">
            {DIAS_SEMANA_OPTIONS.map(dia => (
              <label key={dia.value} className="dia-option" htmlFor={`serie-dia-${dia.value}`}>
                <input
                  type="checkbox"
                  id={`serie-dia-${dia.value}`}
                  checked={diasSeleccionados.includes(dia.value)}
                  onChange={() => handleDiaToggle(dia.value)}
                  disabled={isLoading}
                />
                <span>{dia.short}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Aplicar a</label>
          <div className="scope-options">
            <label className="scope-option" htmlFor="scope-future">
              <input
                type="radio"
                id="scope-future"
                name="scope"
                checked={scope === 'future'}
                onChange={() => setScope('future')}
                disabled={isLoading}
              />
              <div>
                <span className="scope-label">Solo clases futuras</span>
                <span className="scope-desc">Las pasadas quedan como están</span>
              </div>
            </label>
            <label className="scope-option" htmlFor="scope-all">
              <input
                type="radio"
                id="scope-all"
                name="scope"
                checked={scope === 'all_unattended'}
                onChange={() => setScope('all_unattended')}
                disabled={isLoading}
              />
              <div>
                <span className="scope-label">Todas sin asistencia</span>
                <span className="scope-desc">Incluye pasadas donde no asistio</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </DialogBase>
  )
}
