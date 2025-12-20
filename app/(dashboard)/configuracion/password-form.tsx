'use client'

import { useState } from 'react'
import { changePassword } from './actions'
import { getErrorMessage } from '@/lib/utils'
import { SectionWrapper } from '@/components/ui/section-wrapper'
import { FormField, FormMessage } from '@/components/ui/form-field'

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
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al cambiar contraseña' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SectionWrapper>
      {message && <FormMessage type={message.type} message={message.text} />}

      <form onSubmit={handleSubmit} className="form-content">
        <FormField label="Contraseña Actual" required>
          <input
            type="password"
            name="currentPassword"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Nueva Contraseña" required>
          <input
            type="password"
            name="newPassword"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Confirmar Contraseña" required>
          <input
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
          />
        </FormField>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </SectionWrapper>
  )
}
