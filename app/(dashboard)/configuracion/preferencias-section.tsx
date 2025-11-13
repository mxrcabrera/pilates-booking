'use client'

import { useState } from 'react'
import { updatePreferencias } from './actions'

type PreferenciasProps = {
  horasAnticipacionMinima: number
  maxAlumnasPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
}

export function PreferenciasSection({
  horasAnticipacionMinima,
  maxAlumnasPorClase,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin,
  espacioCompartidoId
}: PreferenciasProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessage({ type: 'success', text: 'Preferencias actualizadas correctamente' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar preferencias' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="section-content">
        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label>Anticipación mínima para reservas</label>
            <select
              name="horasAnticipacionMinima"
              defaultValue={horasAnticipacionMinima}
              disabled={isLoading}
            >
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
              <option value="3">3 horas</option>
              <option value="4">4 horas</option>
              <option value="6">6 horas</option>
              <option value="12">12 horas</option>
              <option value="24">24 horas</option>
            </select>
            <p className="form-hint">Tiempo mínimo de anticipación que deben tener las alumnas para reservar clases</p>
          </div>

          <div className="form-group">
            <label>Máximo de alumnas por clase</label>
            <select
              name="maxAlumnasPorClase"
              defaultValue={maxAlumnasPorClase}
              disabled={isLoading}
            >
              <option value="1">1 alumna</option>
              <option value="2">2 alumnas</option>
              <option value="3">3 alumnas</option>
              <option value="4">4 alumnas</option>
              <option value="5">5 alumnas</option>
              <option value="6">6 alumnas</option>
              <option value="8">8 alumnas</option>
              <option value="10">10 alumnas</option>
            </select>
            <p className="form-hint">Cantidad máxima de alumnas que pueden reservar la misma clase</p>
          </div>

          <div className="form-group">
            <label>Horario de Mañana por Default</label>
            <div className="form-row">
              <input
                type="time"
                name="horarioMananaInicio"
                defaultValue={horarioMananaInicio}
                disabled={isLoading}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>a</span>
              <input
                type="time"
                name="horarioMananaFin"
                defaultValue={horarioMananaFin}
                disabled={isLoading}
              />
            </div>
            <p className="form-hint">Horario por defecto para turnos de mañana</p>
          </div>

          <div className="form-group">
            <label>Horario de Tarde por Default</label>
            <div className="form-row">
              <input
                type="time"
                name="horarioTardeInicio"
                defaultValue={horarioTardeInicio}
                disabled={isLoading}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>a</span>
              <input
                type="time"
                name="horarioTardeFin"
                defaultValue={horarioTardeFin}
                disabled={isLoading}
              />
            </div>
            <p className="form-hint">Horario por defecto para turnos de tarde</p>
          </div>

          <div className="form-divider"></div>

          <div className="form-group">
            <label>Espacio Compartido</label>
            <input
              type="text"
              name="espacioCompartidoId"
              defaultValue={espacioCompartidoId || ''}
              placeholder="Código de espacio (ej: studio-palermo)"
              disabled={isLoading}
            />
            <p className="form-hint">
              Si trabajás con otras profesoras en el mismo lugar, usá el mismo código para coordinar horarios.
              Todas las profesoras con el mismo código verán las clases de las demás en su calendario.
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
