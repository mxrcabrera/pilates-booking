'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ExternalLink, AlertCircle } from 'lucide-react'

export default function AlumnoReservarPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cleanCodigo = codigo.trim().toUpperCase()

    if (!cleanCodigo || cleanCodigo.length < 4) {
      setError('Ingresá un código válido')
      setLoading(false)
      return
    }

    try {
      // Buscar profesor por código
      const res = await fetch(`/api/portal/buscar-codigo?codigo=${encodeURIComponent(cleanCodigo)}`)
      const data = await res.json()

      if (data.error || !data.slug) {
        setError('Código no encontrado. Verificá con tu profesor.')
        setLoading(false)
        return
      }

      // Redirigir al portal con el código
      router.push(`/reservar/${data.slug}?codigo=${encodeURIComponent(cleanCodigo)}`)
    } catch {
      setError('Error al buscar. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header centered">
        <div>
          <h1>Reservar Clase</h1>
          <p>Ingresá el código que te compartió tu profesor</p>
        </div>
      </div>

      <div className="content-card search-card">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Lock size={20} />
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="ej: ABC123"
              autoFocus
              maxLength={10}
              style={{ letterSpacing: '0.1em', fontWeight: 600 }}
            />
          </div>

          {error && (
            <div className="search-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || codigo.length < 4}>
            {loading ? 'Buscando...' : 'Ir al portal'}
            {!loading && <ExternalLink size={16} />}
          </button>
        </form>

        <div className="search-help">
          <h3>¿Cómo obtengo el código?</h3>
          <p>
            Tu profesor te compartirá un código de acceso (ej: <code>ABC123</code>).
            Ingresalo arriba para acceder al portal de reservas.
          </p>
        </div>
      </div>
    </div>
  )
}
