'use client'

import { useState } from 'react'
import { updateProfile } from './actions'

type Profesor = {
  nombre: string
  email: string
  telefono: string | null
}

export function ProfileForm({ profesor }: { profesor: Profesor }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updateProfile(formData)
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar perfil' })
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
          <label>Nombre</label>
          <input 
            type="text" 
            name="nombre"
            defaultValue={profesor.nombre}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            defaultValue={profesor.email} 
            disabled 
          />
          <p className="form-hint">El email no se puede modificar</p>
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input
            type="tel"
            name="telefono"
            defaultValue={profesor.telefono || ''}
            placeholder="+54 9 11 1234-5678"
            disabled={isLoading}
          />
        </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}