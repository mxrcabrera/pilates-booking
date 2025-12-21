'use client'

import { useState } from 'react'
import { updatePreferencias } from './actions'
import { PacksSection } from './packs-section'
import { TimeInput } from '@/components/time-input'
import { SelectInput } from '@/components/select-input'
import { SectionWrapper } from '@/components/ui/section-wrapper'
import { FormMessage } from '@/components/ui/form-field'
import type { Pack } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

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
  syncGoogleCalendar: _syncGoogleCalendar,
  hasGoogleAccount: _hasGoogleAccount,
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
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al actualizar preferencias' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SectionWrapper>
        {message && <FormMessage type={message.type} message={message.text} />}

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label>Anticipación mínima para reservas</label>
            <SelectInput
              name="horasAnticipacionMinima"
              defaultValue={horasAnticipacionMinima.toString()}
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
            </SelectInput>
            <p className="form-hint">Tiempo mínimo de anticipación que deben tener los alumnos para reservar clases</p>
          </div>

          <div className="form-group">
            <label>Máximo de alumnos por clase</label>
            <SelectInput
              name="maxAlumnosPorClase"
              defaultValue={maxAlumnosPorClase.toString()}
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
            </SelectInput>
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

          <div className="form-divider"></div>

          <div className="form-group form-group-disabled">
            <label className="label-with-badge">
              Sincronizar con Google Calendar
              <span className="coming-soon-badge">Próximamente</span>
            </label>
            <div className="sync-checkbox-group">
              <input
                type="checkbox"
                disabled={true}
                className="sync-checkbox-input"
              />
              <span className="sync-checkbox-label sync-label-disabled">
                Agregar mis clases automáticamente a Google Calendar
              </span>
            </div>
            <p className="form-hint">
              Estamos trabajando en esta función. Próximamente podrás sincronizar tus clases con Google Calendar.
            </p>
          </div>

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
    </SectionWrapper>
  )
}
