'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { HorariosSection } from './horarios-section'
import { updatePreferencias } from './actions'
import { TimeInput } from '@/components/time-input'

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

type ClasesSectionProps = {
  horarios: Horario[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  maxAlumnosPorClase: number
}

export function ClasesSection({
  horarios,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin,
  maxAlumnosPorClase
}: ClasesSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessage({ type: 'success', text: 'Configuración de clases actualizada correctamente' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="section-content">
        {/* Horarios disponibles */}
        <HorariosSection
          horarios={horarios}
          horarioMananaInicio={horarioMananaInicio}
          horarioMananaFin={horarioMananaFin}
          horarioTardeInicio={horarioTardeInicio}
          horarioTardeFin={horarioTardeFin}
        />

        {/* Configuración de clases */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Calendar size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
              Configuración de Clases
            </h2>
          </div>

          {message && (
            <div className={`form-message ${message.type}`} style={{ marginBottom: '1.5rem' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-content">
            <div className="form-group">
              <label>Horario de Mañana por Default</label>
              <div className="form-row">
                <TimeInput
                  name="horarioMananaInicio"
                  defaultValue={horarioMananaInicio}
                  disabled={isLoading}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>a</span>
                <TimeInput
                  name="horarioMananaFin"
                  defaultValue={horarioMananaFin}
                  disabled={isLoading}
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de mañana</p>
            </div>

            <div className="form-group">
              <label>Horario de Tarde por Default</label>
              <div className="form-row">
                <TimeInput
                  name="horarioTardeInicio"
                  defaultValue={horarioTardeInicio}
                  disabled={isLoading}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>a</span>
                <TimeInput
                  name="horarioTardeFin"
                  defaultValue={horarioTardeFin}
                  disabled={isLoading}
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de tarde</p>
            </div>

            <div className="form-group">
              <label>Capacidad Máxima por Clase</label>
              <select
                name="maxAlumnosPorClase"
                defaultValue={maxAlumnosPorClase}
                required
                disabled={isLoading}
                className="form-select"
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

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
