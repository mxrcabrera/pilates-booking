'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ExternalLink, AlertCircle } from 'lucide-react'

export default function AlumnoReservarPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let cleanSlug = slug.trim().toLowerCase()

    // Extraer slug de URL si pegaron una URL completa
    if (cleanSlug.includes('/reservar/')) {
      const match = cleanSlug.match(/\/reservar\/([a-z0-9-]+)/i)
      if (match) {
        cleanSlug = match[1]
      }
    }

    // Remover caracteres inválidos
    cleanSlug = cleanSlug.replace(/[^a-z0-9-]/g, '')

    if (!cleanSlug || cleanSlug.length < 2) {
      setError('Ingresá un nombre de profesor válido')
      setLoading(false)
      return
    }

    try {
      // Verificar si el profesor existe
      const res = await fetch(`/api/portal/${cleanSlug}/info`)
      const data = await res.json()

      if (data.error || !data.profesor) {
        setError('No se encontró un profesor con ese nombre. Verificá el link.')
        setLoading(false)
        return
      }

      // Redirigir al portal del profesor
      router.push(`/reservar/${cleanSlug}`)
    } catch {
      setError('Error al buscar. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header centered">
        <h1>Reservar Clase</h1>
        <p>Ingresá el link o nombre del portal de tu profesor</p>
      </div>

      <div className="content-card search-card">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="ej: maria-garcia o pilatesbooking.com/reservar/maria-garcia"
              autoFocus
            />
          </div>

          {error && (
            <div className="search-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : 'Ir al portal'}
            {!loading && <ExternalLink size={16} />}
          </button>
        </form>

        <div className="search-help">
          <h3>¿Cómo obtengo el link?</h3>
          <p>
            Tu profesor te puede compartir su link de reservas.
            Generalmente tiene el formato: <code>pilatesbooking.com/reservar/nombre-del-profesor</code>
          </p>
        </div>
      </div>
    </div>
  )
}
