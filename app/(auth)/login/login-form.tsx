'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      if (isSignup) {
        await signup(formData)
      } else {
        await login(formData)
      }
      // No hacer router.push - el server action ya hace redirect
    } catch (err: any) {
      // Ignorar el error NEXT_REDIRECT que es normal
      if (err.message?.includes('NEXT_REDIRECT')) {
        return
      }
      setError(err.message || 'Error al procesar la solicitud')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card animate-fade-in-up">
      <h1>Login</h1>
      
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div>
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="María García"
              required
              disabled={isLoading}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : (isSignup ? 'Crear cuenta' : 'Ingresar')}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup)
            setError(null)
          }}
          disabled={isLoading}
        >
          {isSignup ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </form>
    </div>
  )
}