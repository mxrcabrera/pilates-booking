'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, ChevronRight, AlertCircle, Check, Users } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'

type Profesor = { id: string; nombre: string }

type SlotInfo = {
  fecha: string
  horaInicio: string
  available: number
  total: number
  isBooked: boolean
}

type SlotsResponse = {
  alumno: {
    id: string
    nombre: string
    clasesPorSemana: number | null
  }
  slots: SlotInfo[]
  blockedDates: string[]
  horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>
}

type Message = { type: 'success' | 'error'; text: string }

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

function formatFecha(fechaStr: string): string {
  const date = new Date(fechaStr + 'T00:00:00')
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

function groupSlotsByDate(slots: SlotInfo[]): Map<string, SlotInfo[]> {
  const grouped = new Map<string, SlotInfo[]>()
  for (const slot of slots) {
    if (!grouped.has(slot.fecha)) grouped.set(slot.fecha, [])
    grouped.get(slot.fecha)!.push(slot)
  }
  return grouped
}

export default function AlumnoReservarPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [selectedProfesor, setSelectedProfesor] = useState<string | null>(null)
  const [slotsData, setSlotsData] = useState<SlotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [reservando, setReservando] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  useEffect(() => {
    async function fetchProfesores() {
      try {
        const res = await fetch('/api/alumno/dashboard')
        const data = await res.json()
        if (data.error) return
        const profs = data.profesores || []
        setProfesores(profs)
        // Auto-select if single profesor
        if (profs.length === 1) {
          setSelectedProfesor(profs[0].id)
        }
      } catch { /* handled by empty state */ }
      finally { setLoading(false) }
    }
    fetchProfesores()
  }, [])

  const fetchSlots = useCallback(async (profesorId: string) => {
    setLoadingSlots(true)
    setSlotsData(null)
    try {
      const res = await fetch(`/api/alumno/slots?profesorId=${profesorId}`)
      const data = await res.json()
      if (!data.error) {
        setSlotsData(data)
      }
    } catch { /* handled by empty state */ }
    finally { setLoadingSlots(false) }
  }, [])

  useEffect(() => {
    if (selectedProfesor) fetchSlots(selectedProfesor)
  }, [selectedProfesor, fetchSlots])

  async function handleReservar(slot: SlotInfo) {
    if (!selectedProfesor || slot.isBooked || slot.available <= 0) return

    const key = `${slot.fecha}|${slot.horaInicio}`
    setReservando(key)
    setMessage(null)

    try {
      const res = await fetch('/api/alumno/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profesorId: selectedProfesor,
          fecha: slot.fecha,
          horaInicio: slot.horaInicio
        })
      })

      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Clase reservada' })
        // Refresh slots
        fetchSlots(selectedProfesor)
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al reservar' })
    } finally {
      setReservando(null)
    }
  }

  if (loading) return <PageLoading />

  if (profesores.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Reservar Clase</h1>
          </div>
        </div>
        <EmptyState
          icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
          title="No tenes profesores vinculados"
          description="Contacta a tu profesor para que te vincule como alumno"
        />
      </div>
    )
  }

  const slotsByDate = slotsData ? groupSlotsByDate(slotsData.slots) : new Map<string, SlotInfo[]>()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Reservar Clase</h1>
          <p>Elegi un horario disponible para reservar</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Profesor selection (only if multiple) */}
      {profesores.length > 1 && (
        <section className="content-section">
          <h2>Profesor</h2>
          <div className="profesores-grid">
            {profesores.map(prof => (
              <button
                key={prof.id}
                className={`profesor-card${selectedProfesor === prof.id ? ' selected' : ''}`}
                onClick={() => setSelectedProfesor(prof.id)}
              >
                <div className="profesor-avatar">
                  {prof.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="profesor-nombre">{prof.nombre}</span>
                <ChevronRight size={16} className="profesor-arrow" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pack info */}
      {slotsData?.alumno.clasesPorSemana && (
        <div className="slot-pack-info">
          Tu pack: {slotsData.alumno.clasesPorSemana} clase(s) por semana
        </div>
      )}

      {/* Available days legend */}
      {slotsData && slotsData.horarios.length > 0 && (
        <div className="slot-horarios-legend">
          <Clock size={14} />
          <span>
            {slotsData.horarios
              .sort((a, b) => a.diaSemana - b.diaSemana)
              .map(h => `${DIAS_SEMANA[h.diaSemana]} ${h.horaInicio}-${h.horaFin}`)
              .join(' / ')}
          </span>
        </div>
      )}

      {/* Slots grid */}
      {loadingSlots ? (
        <div className="loading-inline">Cargando horarios disponibles...</div>
      ) : selectedProfesor && slotsByDate.size === 0 ? (
        <EmptyState
          icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
          title="Sin horarios disponibles"
          description="No hay clases programadas en las proximas semanas"
        />
      ) : (
        <div className="slots-by-date">
          {[...slotsByDate.entries()].map(([fecha, slots]) => (
            <section key={fecha} className="slot-date-group">
              <h3 className="slot-date-title">{formatFecha(fecha)}</h3>
              <div className="slot-time-list">
                {slots.map(slot => {
                  const slotKey = `${slot.fecha}|${slot.horaInicio}`
                  const isReservando = reservando === slotKey

                  return (
                    <div
                      key={slotKey}
                      className={`slot-time-card${slot.isBooked ? ' booked' : ''}${slot.available <= 0 && !slot.isBooked ? ' full' : ''}`}
                    >
                      <div className="slot-time-info">
                        <Clock size={16} />
                        <span className="slot-hora">{slot.horaInicio}</span>
                        <span className="slot-capacity">
                          <Users size={14} />
                          {slot.available}/{slot.total}
                        </span>
                      </div>

                      {slot.isBooked ? (
                        <span className="slot-badge booked">Reservada</span>
                      ) : slot.available > 0 ? (
                        <button
                          className="slot-book-btn"
                          onClick={() => handleReservar(slot)}
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
