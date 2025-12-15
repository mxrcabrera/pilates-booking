'use client'

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { updatePreferencias } from './actions'

type SistemaSectionProps = {
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  hasGoogleAccount: boolean
}

export function SistemaSection({
  espacioCompartidoId,
  syncGoogleCalendar,
  hasGoogleAccount
}: SistemaSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessage({ type: 'success', text: 'Configuración del sistema actualizada correctamente' })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Settings2 size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
            Configuración del Sistema
          </h2>
        </div>

        {message && (
          <div className={`form-message ${message.type}`} style={{ marginBottom: '1.5rem' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label>Espacio Compartido</label>
            <input
              type="text"
              name="espacioCompartidoId"
              defaultValue={espacioCompartidoId || ''}
              placeholder="Código de espacio (ej: studio-palermo)"
              disabled={isLoading}
              className="form-input"
            />
            <p className="form-hint">
              Si trabajás con otros profesores en el mismo lugar, usá el mismo código para coordinar horarios.
              Todos los profesores con el mismo código verán las clases de las demás en su calendario.
            </p>
          </div>

          {/* Google Calendar sync temporalmente deshabilitado
          <div className="form-divider" style={{ margin: '2rem 0' }}></div>

          <div className="form-group">
            <label>Sincronización con Google Calendar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                name="syncGoogleCalendar"
                defaultChecked={syncGoogleCalendar}
                disabled={isLoading || !hasGoogleAccount}
                style={{ width: 'auto', margin: 0 }}
                className="form-checkbox"
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Agregar mis clases automáticamente a Google Calendar
              </span>
            </div>
            {!hasGoogleAccount && (
              <p className="form-hint" style={{ color: 'rgba(255, 180, 100, 0.9)', marginTop: '0.75rem' }}>
                ⚠️ Para usar esta función, primero debes iniciar sesión con Google. Cerrá sesión y volvé a iniciar con tu cuenta de Google.
              </p>
            )}
            {hasGoogleAccount && (
              <p className="form-hint" style={{ marginTop: '0.75rem' }}>
                Cuando esta opción está activada, todas tus clases se agregarán automáticamente a tu Google Calendar.
                Tus alumnos recibirán invitaciones por email con la información de la clase.
              </p>
            )}
          </div>
          */}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
