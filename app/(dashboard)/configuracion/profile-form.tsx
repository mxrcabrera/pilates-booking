'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { getErrorMessage } from '@/lib/utils'
import { SectionWrapper } from '@/components/ui/section-wrapper'
import { FormField, FormMessage } from '@/components/ui/form-field'

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
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al actualizar perfil' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SectionWrapper>
      {message && <FormMessage type={message.type} message={message.text} />}

      <form onSubmit={handleSubmit} className="form-content">
        <FormField label="Nombre" required>
          <input
            type="text"
            name="nombre"
            defaultValue={profesor.nombre}
            required
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Email" hint="El email no se puede modificar">
          <input
            type="email"
            defaultValue={profesor.email}
            disabled
          />
        </FormField>

        <FormField label="Teléfono">
          <input
            type="tel"
            name="telefono"
            defaultValue={profesor.telefono || ''}
            placeholder="+54 9 11 1234-5678"
            disabled={isLoading}
          />
        </FormField>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </SectionWrapper>
  )
}
