'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const isValidLink = token && email

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

      router.push('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidLink) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Pilates Booking</h1>
          <p className="auth-subtitle">Enlace inválido o incompleto.</p>
          <Link href="/forgot-password" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Pilates Booking</h1>
        <p className="auth-subtitle">Ingresá tu nueva contraseña</p>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Nueva contraseña</label>
            <div className="auth-password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Min. 6 caracteres"
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Repetí la contraseña"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <Link href="/login" className="auth-switch">
          Volver al login
        </Link>
      </div>
    </div>
  )
}
