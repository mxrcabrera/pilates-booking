'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithGoogle } from './actions'

type Rol = 'profesor' | 'alumno'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rol, setRol] = useState<Rol>('profesor')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nombre = formData.get('nombre') as string

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nombre: isSignup ? nombre : undefined,
          rol: isSignup ? rol : undefined,
          action: isSignup ? 'signup' : 'login',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

      if (data.redirectTo) {
        router.push(data.redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card animate-fade-in-up">
      <div className="login-header">
        <h1>Pilates Booking</h1>
        <p>{isSignup ? 'Crear una cuenta nueva' : 'Bienvenido de vuelta'}</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <div className="rol-selector">
              <label className="rol-label">Soy...</label>
              <div className="rol-options">
                <button
                  type="button"
                  className={`rol-option ${rol === 'profesor' ? 'active' : ''}`}
                  onClick={() => setRol('profesor')}
                  disabled={isLoading}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Profesor/a</span>
                </button>
                <button
                  type="button"
                  className={`rol-option disabled ${rol === 'alumno' ? 'active' : ''}`}
                  onClick={() => {}}
                  disabled={true}
                  title="Próximamente disponible"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Alumno/a</span>
                  <span className="coming-soon-badge">Próximamente</span>
                </button>
              </div>
            </div>

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
          </>
        )}

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="email@ejemplo.com"
            required
            disabled={isLoading}
          />
        </div>

        <div className="password-field">
          <label htmlFor="password">Contraseña</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading || (isSignup && rol === 'alumno')}>
          {isLoading ? 'Cargando...' : (isSignup ? 'Crear cuenta' : 'Ingresar')}
        </button>

        <div className="divider">
          <span>O continuar con</span>
        </div>

        <button
          type="button"
          onClick={() => loginWithGoogle()}
          disabled={isLoading}
          className="btn-google"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup)
            setError(null)
          }}
          disabled={isLoading}
          className="btn-secondary"
        >
          {isSignup ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </form>
    </div>
  )
}
