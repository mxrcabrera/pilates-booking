'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, X, Check, AlertCircle } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { logger } from '@/lib/logger'

type Clase = {
  id: string
  fecha: string
  hora: string
  estado: string
  profesorNombre: string
}

export default function MisClasesPage() {
  const [loading, setLoading] = useState(true)
  const [clases, setClases] = useState<Clase[]>([])
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const loadClases = async () => {
    try {
      const res = await fetch('/api/alumno/mis-clases')
      const data = await res.json()
      if (data.clases) {
        setClases(data.clases)
      }
    } catch (error) {
      logger.error('Error loading clases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClases()
  }, [])

  const cancelarClase = async (claseId: string) => {
    setCancelando(claseId)
    setMessage(null)

    try {
      const res = await fetch(`/api/alumno/cancelar?id=${claseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Clase cancelada correctamente' })
        loadClases()
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al cancelar la clase' })
    } finally {
      setCancelando(null)
    }
  }

  if (loading) return <PageLoading />

  const proximasClases = clases.filter(c => c.estado !== 'cancelada')
  const historial = clases.filter(c => c.estado === 'cancelada')

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mis Clases</h1>
          <p>Tus reservas y clases programadas</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <section className="content-section">
        <h2>Próximas clases</h2>

        {proximasClases.length === 0 ? (
          <EmptyState
            icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Sin clases programadas"
            description="Reservá una clase desde el portal de tu profesor"
          />
        ) : (
          <div className="clases-grid">
            {proximasClases.map(clase => (
              <div key={clase.id} className="clase-card-alumno">
                <div className="clase-card-header">
                  <div className="clase-fecha-info">
                    <Calendar size={18} />
                    <span>
                      {new Date(clase.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>
                  <div className="clase-hora-info">
                    <Clock size={18} />
                    <span>{clase.hora}</span>
                  </div>
                </div>

                <div className="clase-card-body">
                  <div className="clase-profesor-info">
                    <User size={16} />
                    <span>{clase.profesorNombre}</span>
                  </div>
                </div>

                <div className="clase-card-footer">
                  <button
                    className="btn-cancel"
                    onClick={() => cancelarClase(clase.id)}
                    disabled={cancelando === clase.id}
                  >
                    {cancelando === clase.id ? 'Cancelando...' : 'Cancelar reserva'}
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {historial.length > 0 && (
        <section className="content-section muted">
          <h2>Historial</h2>
          <div className="historial-list">
            {historial.map(clase => (
              <div key={clase.id} className="historial-item">
                <span className="historial-fecha">
                  {new Date(clase.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                <span className="historial-hora">{clase.hora}</span>
                <span className="historial-profesor">{clase.profesorNombre}</span>
                <span className="historial-estado cancelled">Cancelada</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
