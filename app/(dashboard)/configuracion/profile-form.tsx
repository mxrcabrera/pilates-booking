'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { getErrorMessage } from '@/lib/utils'
import { FormField, FormMessage } from '@/components/ui/form-field'

type Profesor = {
  nombre: string
  email: string
  telefono: string | null
}

type FormErrors = {
  nombre?: string
  telefono?: string
}

export function ProfileForm({ profesor }: { profesor: Profesor }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [nombre, setNombre] = useState(profesor.nombre)
  const [telefono, setTelefono] = useState(profesor.telefono || '')

  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre es demasiado largo'
    }

    if (telefono && telefono.replace(/\D/g, '').length > 0) {
      if (telefono.replace(/\D/g, '').length < 8) {
        newErrors.telefono = 'El teléfono debe tener al menos 8 dígitos'
      } else if (telefono.replace(/\D/g, '').length > 15) {
        newErrors.telefono = 'El teléfono es demasiado largo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Corregí los errores del formulario' })
      return
    }

    setIsLoading(true)

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
    <div className="accordion-form">
      {message && <FormMessage type={message.type} message={message.text} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField 
          label="Nombre y Apellido" 
          required 
          error={errors.nombre}
          hint="Este es el nombre que verán tus alumnos al reservar."
        >
          <input
            type="text"
            name="nombre"
            value={nombre}
            onChange={e => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors(err => ({ ...err, nombre: undefined }))
            }}
            disabled={isLoading}
            className={errors.nombre ? 'input-error' : ''}
          />
        </FormField>

        <FormField 
          label="Correo Electrónico" 
          hint={<span className="opacity-50">El email está vinculado a tu cuenta de Supabase y no puede ser modificado.</span>}
        >
          <input
            type="email"
            defaultValue={profesor.email}
            disabled
          />
        </FormField>

        <FormField 
          label="Teléfono de Contacto" 
          error={errors.telefono}
          hint="Utilizado para coordinaciones internas y alertas."
        >
          <input
            type="tel"
            name="telefono"
            value={telefono}
            onChange={e => {
              setTelefono(e.target.value)
              if (errors.telefono) setErrors(err => ({ ...err, telefono: undefined }))
            }}
            placeholder="+54 9 11 1234-5678"
            disabled={isLoading}
            className={errors.telefono ? 'input-error' : ''}
          />
        </FormField>

        <div className="accordion-form-actions !mt-4">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
