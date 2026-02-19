'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    if (!email || !email.includes('@')) {
      setError('Ingresá un email válido')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Pilates Booking</h1>

        {sent ? (
          <>
            <p className="auth-subtitle">
              Si el email existe en nuestro sistema, te enviamos un enlace para restablecer tu contraseña.
            </p>
            <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>
              Revisá tu bandeja de entrada y la carpeta de spam.
            </p>
            <Link href="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
              Volver al login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="tu@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <Link href="/login" className="auth-switch">
              Volver al login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
