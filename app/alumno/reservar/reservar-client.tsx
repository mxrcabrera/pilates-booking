'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Check, AlertCircle, Users } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'

type ClaseDisponible = {
  id: string
  fecha: string
  horaInicio: string
  profesorId: string
  profesorNombre: string
  cuposMaximos: number
  cuposDisponibles: number
  estaReservado: boolean
}

type Message = { type: 'success' | 'error'; text: string }

function formatFecha(fechaStr: string): string {
  const date = new Date(fechaStr + 'T00:00:00')
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

function groupClasesByDate(clases: ClaseDisponible[]): Map<string, ClaseDisponible[]> {
  const grouped = new Map<string, ClaseDisponible[]>()
  for (const clase of clases) {
    if (!grouped.has(clase.fecha)) grouped.set(clase.fecha, [])
    grouped.get(clase.fecha)!.push(clase)
  }
  return grouped
}

interface ReservarClientProps {
  estudioId: string
}

export function ReservarClient({ estudioId }: ReservarClientProps) {
  const [clases, setClases] = useState<ClaseDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  useEffect(() => {
    async function fetchClases() {
      try {
        const res = await fetch(`/api/v1/clases/disponibles?estudioId=${estudioId}`)
        const data = await res.json()
        if (data.success) {
          setClases(data.clases)
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClases()
  }, [estudioId])

  async function handleReservar(clase: ClaseDisponible) {
    if (clase.estaReservado || clase.cuposDisponibles <= 0) return

    setReservando(clase.id)
    setMessage(null)

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claseId: clase.id,
          estudioId,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Clase reservada correctamente' })
        // Refresh classes
        const resRefresh = await fetch(`/api/v1/clases/disponibles?estudioId=${estudioId}`)
        const dataRefresh = await resRefresh.json()
        if (dataRefresh.success) {
          setClases(dataRefresh.clases)
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al reservar clase' })
    } finally {
      setReservando(null)
    }
  }

  if (loading) return <PageLoading />

  const clasesByDate = groupClasesByDate(clases)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Reservar Clase</h1>
          <p>Elegí un horario disponible para reservar</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {clasesByDate.size === 0 ? (
        <EmptyState
          icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
          title="Sin clases disponibles"
          description="No hay clases programadas en las próximas semanas"
        />
      ) : (
        <div className="slots-by-date">
          {[...clasesByDate.entries()].map(([fecha, clasesFecha]) => (
            <section key={fecha} className="slot-date-group">
              <h3 className="slot-date-title">{formatFecha(fecha)}</h3>
              <div className="slot-time-list">
                {clasesFecha.map(clase => {
                  const isReservando = reservando === clase.id

                  return (
                    <div
                      key={clase.id}
                      className={`slot-time-card${clase.estaReservado ? ' booked' : ''}${clase.cuposDisponibles <= 0 && !clase.estaReservado ? ' full' : ''}`}
                    >
                      <div className="slot-time-info">
                        <Clock size={16} />
                        <span className="slot-hora">{clase.horaInicio}</span>
                        <span className="slot-profe">con {clase.profesorNombre}</span>
                        <span className="slot-capacity">
                          <Users size={14} />
                          {clase.cuposDisponibles}/{clase.cuposMaximos}
                        </span>
                      </div>

                      {clase.estaReservado ? (
                        <span className="slot-badge booked">Reservada</span>
                      ) : clase.cuposDisponibles > 0 ? (
                        <button
                          className="slot-book-btn"
                          onClick={() => handleReservar(clase)}
                          disabled={isReservando}
                        >
                          {isReservando ? 'Reservando...' : 'Reservar'}
                        </button>
                      ) : (
                        <span className="slot-badge full">Completo</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
