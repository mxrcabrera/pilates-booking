'use client'

import { useState } from 'react'
import { Globe, Copy, Check, ExternalLink, Lock } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

type Props = {
  slug: string | null
  portalActivo: boolean
  portalDescripcion: string | null
  canUsePortal: boolean
  currentPlan: string
}

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

export function PortalSection({ slug, portalActivo, portalDescripcion, canUsePortal, currentPlan }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [localSlug, setLocalSlug] = useState(slug || '')
  const [localActivo, setLocalActivo] = useState(portalActivo)
  const [localDescripcion, setLocalDescripcion] = useState(portalDescripcion || '')

  const portalUrl = localSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reservar/${localSlug}` : null

  const copyUrl = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!canUsePortal) {
      setMessage({ type: 'error', text: `El portal de alumnos está disponible desde el plan ${PLAN_NAMES['STARTER']}` })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/v1/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePortal',
          slug: localSlug.toLowerCase().trim(),
          portalActivo: localActivo,
          portalDescripcion: localDescripcion.trim()
        })
      })

      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Configuración del portal guardada' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al guardar' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="section-content">
        <div className="section-header">
          <div className="section-header-title">
            <Globe size={20} />
            <h2>Portal de Reservas</h2>
          </div>
          {!canUsePortal && (
            <span className="feature-badge locked">
              <Lock size={12} />
              {PLAN_NAMES['STARTER']}+
            </span>
          )}
        </div>

        <p className="section-description">
          Compartí un link público para que tus alumnos reserven clases directamente
        </p>

        <div className="portal-config">
          {/* Toggle activar */}
          <div className="portal-toggle-row">
            <label className="toggle-label">
              <span>Portal activo</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localActivo}
                  onChange={(e) => setLocalActivo(e.target.checked)}
                  disabled={isLoading || !canUsePortal}
                />
                <span className="toggle-slider"></span>
              </label>
            </label>
          </div>

          {/* Slug input */}
          <div className="form-group">
            <label>URL del portal</label>
            <div className="portal-url-input">
              <span className="portal-url-prefix">/reservar/</span>
              <input
                type="text"
                value={localSlug}
                onChange={(e) => setLocalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="mi-estudio"
                disabled={isLoading || !canUsePortal}
                className="form-input"
                maxLength={30}
              />
            </div>
            <p className="form-hint">Solo letras minúsculas, números y guiones (3-30 caracteres)</p>
          </div>

          {/* URL copiable */}
          {portalUrl && localActivo && (
            <div className="portal-url-preview">
              <span className="portal-url-text">{portalUrl}</span>
              <div className="portal-url-actions">
                <button
                  type="button"
                  onClick={copyUrl}
                  className="portal-url-btn"
                  title="Copiar URL"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-url-btn"
                  title="Abrir portal"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={localDescripcion}
              onChange={(e) => setLocalDescripcion(e.target.value)}
              placeholder="Bienvenido a mi espacio de pilates..."
              disabled={isLoading || !canUsePortal}
              className="form-input form-textarea"
              rows={3}
              maxLength={500}
            />
            <p className="form-hint">Se muestra en el encabezado del portal</p>
          </div>

          {/* Botón guardar */}
          <div className="portal-actions">
            {message && (
              <div className={`form-message ${message.type}`}>
                {message.text}
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !canUsePortal}
              className="btn-primary"
            >
              {isLoading ? 'Guardando...' : 'Guardar Portal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
