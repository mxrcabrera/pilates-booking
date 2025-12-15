'use client'

import { useState } from 'react'
import { updatePreferencias } from './actions'
import { PacksSection } from './packs-section'
import { TimeInput } from '@/components/time-input'

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type PreferenciasProps = {
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  hasGoogleAccount: boolean
  packs: Pack[]
}

export function PreferenciasSection({
  horasAnticipacionMinima,
  maxAlumnosPorClase,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin,
  espacioCompartidoId,
  syncGoogleCalendar,
  hasGoogleAccount,
  packs
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
              required
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
            <p className="form-hint">Tiempo mínimo de anticipación que deben tener los alumnos para reservar clases</p>
          </div>

          <div className="form-group">
            <label>Máximo de alumnos por clase</label>
            <select
              name="maxAlumnosPorClase"
              defaultValue={maxAlumnosPorClase}
              required
              disabled={isLoading}
            >
              <option value="1">1 alumno</option>
              <option value="2">2 alumnos</option>
              <option value="3">3 alumnos</option>
              <option value="4">4 alumnos</option>
              <option value="5">5 alumnos</option>
              <option value="6">6 alumnos</option>
              <option value="8">8 alumnos</option>
              <option value="10">10 alumnos</option>
            </select>
            <p className="form-hint">Cantidad máxima de alumnos que pueden reservar la misma clase</p>
          </div>

          <div className="form-group">
            <label>Horario de Mañana por Default</label>
            <div className="form-row">
              <TimeInput
                name="horarioMananaInicio"
                defaultValue={horarioMananaInicio}
                disabled={isLoading}
              />
              <span className="time-separator">a</span>
              <TimeInput
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
              <TimeInput
                name="horarioTardeInicio"
                defaultValue={horarioTardeInicio}
                disabled={isLoading}
              />
              <span className="time-separator">a</span>
              <TimeInput
                name="horarioTardeFin"
                defaultValue={horarioTardeFin}
                disabled={isLoading}
              />
            </div>
            <p className="form-hint">Horario por defecto para turnos de tarde</p>
          </div>

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
              Si trabajás con otros profesores en el mismo lugar, usá el mismo código para coordinar horarios.
              Todos los profesores con el mismo código verán las clases de las demás en su calendario.
            </p>
          </div>

          {/* Google Calendar sync temporalmente deshabilitado
          <div className="form-divider"></div>

          <div className="form-group">
            <label>Sincronizar con Google Calendar</label>
            <div className="sync-checkbox-group">
              <input
                type="checkbox"
                name="syncGoogleCalendar"
                defaultChecked={syncGoogleCalendar}
                disabled={isLoading || !hasGoogleAccount}
                className="sync-checkbox-input"
              />
              <span className="sync-checkbox-label">
                Agregar mis clases automáticamente a Google Calendar
              </span>
            </div>
            {!hasGoogleAccount && (
              <p className="form-hint sync-warning-hint">
                Para usar esta función, primero debes iniciar sesión con Google. Cerrá sesión y volvé a iniciar con tu cuenta de Google.
              </p>
            )}
            {hasGoogleAccount && (
              <p className="form-hint">
                Cuando esta opción está activada, todas tus clases se agregarán automáticamente a tu Google Calendar.
                Tus alumnos recibirán invitaciones por email con la información de la clase.
              </p>
            )}
          </div>
          */}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

        <div className="subsection-header">
          <h2 className="subsection-title">
            Packs y Precios
          </h2>
          <p className="subsection-description">
            Configurá tus packs de clases con precios personalizados
          </p>
          <PacksSection packs={packs} />
        </div>
      </div>
    </div>
  )
}
