'use client'

import { useState, useEffect } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

interface MercadoPagoConfigProps {
  estudioId: string | null
  isOwner: boolean
}

export function MercadoPagoConfig({ estudioId, isOwner }: MercadoPagoConfigProps) {
  const [configured, setConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [publicKey, setPublicKey] = useState('')

  // Check if Mercado Pago is configured on mount
  useEffect(() => {
    async function checkConfig() {
      if (!estudioId) {
        setIsChecking(false)
        return
      }

      try {
        const res = await fetch('/api/estudio/pagos')
        if (res.ok) {
          const data = await res.json()
          setConfigured(data.configured)
        }
      } catch (error) {
        console.error('Error checking Mercado Pago config:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkConfig()
  }, [estudioId])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!estudioId) return

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/estudio/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpAccessToken: accessToken,
          mpPublicKey: publicKey,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar configuración')
      }

      setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' })
      setConfigured(true)
      setAccessToken('')
      setPublicKey('')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al guardar configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!estudioId) return
    if (!confirm('¿Estás seguro de eliminar las credenciales de Mercado Pago?')) return

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/estudio/pagos', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar configuración')
      }

      setMessage({ type: 'success', text: 'Credenciales eliminadas correctamente' })
      setConfigured(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al eliminar configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOwner) {
    return null
  }

  if (isChecking) {
    return (
      <div className="settings-section">
        <div className="section-content">
          <div className="horarios-header" style={{ marginBottom: '1.25rem' }}>
            <h2 className="horarios-header-title">Mercado Pago</h2>
          </div>
          <div className="form-message" style={{ textAlign: 'center' }}>
            Cargando configuración...
          </div>
        </div>
      </div>
    )
  }

  if (!estudioId) {
    return (
      <div className="settings-section">
        <div className="section-content">
          <div className="horarios-header" style={{ marginBottom: '1.25rem' }}>
            <h2 className="horarios-header-title">Mercado Pago</h2>
          </div>
          <div className="form-message error">
            Esta configuración solo está disponible para estudios multi-tenant
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <div className="section-content">
        <div className="horarios-header" style={{ marginBottom: '1.25rem' }}>
          <h2 className="horarios-header-title">Mercado Pago</h2>
        </div>

        {message && (
          <div className={`form-message ${message.type}`} role="alert" style={{ marginBottom: '1rem' }}>
            {message.text}
          </div>
        )}

        {configured ? (
          <div className="form-message success" style={{ marginBottom: '1.5rem' }}>
            ✓ Mercado Pago está configurado
          </div>
        ) : (
          <p className="form-hint" style={{ marginBottom: '1.5rem' }}>
            Configura tus credenciales de Mercado Pago para procesar pagos online.
          </p>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="mp-access-token">Access Token</label>
            <input
              id="mp-access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
              className="form-input"
              placeholder="APP_USR-..."
              required={!configured}
            />
            <p className="form-hint">
              Token de acceso de Mercado Pago (Production Access Token)
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="mp-public-key">Public Key</label>
            <input
              id="mp-public-key"
              type="password"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              disabled={isLoading}
              className="form-input"
              placeholder="APP_USR-..."
              required={!configured}
            />
            <p className="form-hint">
              Public Key de Mercado Pago para el frontend
            </p>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>

            {configured && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Eliminar Configuración</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
