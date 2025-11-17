'use client'

import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { PacksSection } from './packs-section'
import { updatePreferencias } from './actions'

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type PacksTabProps = {
  packs: Pack[]
  horasAnticipacionMinima: number
}

export function PacksTab({ packs, horasAnticipacionMinima }: PacksTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessage({ type: 'success', text: 'Configuración de reservas actualizada correctamente' })
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
        {/* Configuración de Reservas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <DollarSign size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
              Configuración de Reservas
            </h2>
          </div>

          {message && (
            <div className={`form-message ${message.type}`} style={{ marginBottom: '1.5rem' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-content">
            <div className="form-group">
              <label>Anticipación Mínima para Reservas</label>
              <select
                name="horasAnticipacionMinima"
                defaultValue={horasAnticipacionMinima}
                required
                disabled={isLoading}
                className="form-select"
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

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>

        <div className="form-divider" style={{ margin: '3rem 0' }}></div>

        {/* Packs y Precios */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.5rem' }}>
            Packs y Precios
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
            Configurá tus paquetes de clases con precios personalizados
          </p>
          <PacksSection packs={packs} />
        </div>
      </div>
    </div>
  )
}
