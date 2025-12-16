'use client'

import { useState } from 'react'
import { changePassword } from './actions'

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await changePassword(formData)
      setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' })
      e.currentTarget.reset()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al cambiar contraseña' })
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
          <label>Contraseña Actual</label>
          <input 
            type="password" 
            name="currentPassword"
            placeholder="••••••••" 
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Nueva Contraseña</label>
          <input 
            type="password" 
            name="newPassword"
            placeholder="••••••••" 
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Confirmar Contraseña</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}