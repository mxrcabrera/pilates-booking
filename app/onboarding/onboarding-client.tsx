'use client'

import { useState } from 'react'
import { updateUserRole } from './actions'
import { getErrorMessage } from '@/lib/utils'

type User = {
  id?: string
  email?: string | null
  name?: string | null
}

export function OnboardingClient({ user }: { user: User }) {
  const [selectedRole, setSelectedRole] = useState<'PROFESOR' | 'ALUMNO' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!selectedRole) {
      setError('Por favor seleccioná un rol')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await updateUserRole(selectedRole)
      // La redirección se maneja en el server action
    } catch (err) {
      setError(getErrorMessage(err) || 'Error al guardar el rol')
      setIsLoading(false)
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>Bienvenido/a{user.name ? `, ${user.name}` : ''}!</h1>
        <p className="onboarding-subtitle">Para continuar, por favor indicanos si sos:</p>

        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}

        <div className="role-selection">
          <button
            type="button"
            className={`role-card ${selectedRole === 'PROFESOR' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('PROFESOR')}
            disabled={isLoading}
          >
            <div className="role-icon">👨‍🏫</div>
            <h2>Profesor</h2>
            <p>Gestiono mis clases y alumnos</p>
          </button>

          <button
            type="button"
            className={`role-card ${selectedRole === 'ALUMNO' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('ALUMNO')}
            disabled={isLoading}
          >
            <div className="role-icon">🧘</div>
            <h2>Alumno</h2>
            <p>Reservo y gestiono mis clases</p>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary onboarding-submit"
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
