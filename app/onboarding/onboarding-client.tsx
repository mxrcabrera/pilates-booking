'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { updateUserRole } from './actions'
import { getErrorMessage } from '@/lib/utils'
import { Suspense } from 'react'

type User = {
  id?: string
  email?: string | null
  name?: string | null
}

function OnboardingContent({ user }: { user: User }) {
  const searchParams = useSearchParams()
  const preselectedRole = searchParams.get('role')?.toUpperCase() as 'PROFESOR' | 'ALUMNO' | null
  const [selectedRole, setSelectedRole] = useState<'PROFESOR' | 'ALUMNO' | null>(preselectedRole || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(role: 'PROFESOR' | 'ALUMNO') {
    setIsLoading(true)
    setError(null)

    try {
      await updateUserRole(role)
      // La redirección se maneja en el server action
    } catch (err) {
      setError(getErrorMessage(err) || 'Error al guardar el rol')
      setIsLoading(false)
    }
  }

  // Si hay rol pre-seleccionado, enviar automáticamente
  useEffect(() => {
    if (preselectedRole) {
      handleSubmit(preselectedRole)
    }
  }, [preselectedRole])

  if (preselectedRole) {
    return <div className="onboarding-container">Configurando tu cuenta...</div>
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
          onClick={() => selectedRole && handleSubmit(selectedRole)}
          className="btn-primary onboarding-submit"
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

export function OnboardingClient({ user }: { user: User }) {
  return (
    <Suspense fallback={<div className="onboarding-container">Cargando...</div>}>
      <OnboardingContent user={user} />
    </Suspense>
  )
}
