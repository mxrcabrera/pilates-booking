'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, X, User, LogOut, Bell } from 'lucide-react'
import { signOut } from 'next-auth/react'

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
}

type Slot = {
  hora: string
  disponible: boolean
  ocupados: number
  maxAlumnos: number
}

type Reserva = {
  id: string
  fecha: string
  hora: string
  estado: string
}

type Espera = {
  id: string
  fecha: string
  hora: string
  posicion: number
}

type Props = {
  profesor: {
    id: string
    nombre: string
    slug: string
    descripcion: string | null
    config: {
      horasAnticipacionMinima: number
      maxAlumnosPorClase: number
      precioPorClase: string
      horarioMananaInicio: string
      horarioMananaFin: string
      turnoMananaActivo: boolean
      horarioTardeInicio: string
      horarioTardeFin: string
      turnoTardeActivo: boolean
    }
    packs: Pack[]
    horarios: Horario[]
  }
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatFecha(fecha: Date): string {
  return fecha.toISOString().split('T')[0]
}

function formatPrecio(precio: string): string {
  const num = parseFloat(precio)
  if (num === 0) return 'Gratis'
  return `$${num.toLocaleString('es-AR')}`
}

export function PortalClient({ profesor }: Props) {
  const { data: session } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [misEsperas, setMisEsperas] = useState<Espera[]>([])
  const [anotandoEspera, setAnotandoEspera] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const loadSlots = useCallback(async (fecha: Date) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/disponibilidad?fecha=${formatFecha(fecha)}`)
      const data = await res.json()
      if (data.slots) {
        setSlots(data.slots)
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }, [profesor.slug])

  const loadMisReservas = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/reservar`)
      const data = await res.json()
      if (data.reservas) {
        setMisReservas(data.reservas)
      }
    } catch (error) {
      console.error('Error loading reservas:', error)
    }
  }, [profesor.slug])

  const loadMisEsperas = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/lista-espera`)
      const data = await res.json()
      if (data.enEspera) {
        setMisEsperas(data.enEspera)
      }
    } catch (error) {
      console.error('Error loading lista espera:', error)
    }
  }, [profesor.slug])

  // Cargar slots cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate)
    }
  }, [selectedDate, loadSlots])

  // Cargar mis reservas y lista de espera al montar
  useEffect(() => {
    loadMisReservas()
    loadMisEsperas()
  }, [loadMisReservas, loadMisEsperas])

  const reservar = async (hora: string) => {
    if (!selectedDate) return

    setReservando(true)
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: formatFecha(selectedDate),
          hora
        })
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: '¡Reserva confirmada!' })
        loadSlots(selectedDate)
        loadMisReservas()
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al reservar' })
    } finally {
      setReservando(false)
    }
  }

  const cancelarReserva = async (id: string) => {
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/reservar?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Reserva cancelada' })
        loadMisReservas()
        if (selectedDate) loadSlots(selectedDate)
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al cancelar' })
    }
  }

  const anotarseEnEspera = async (hora: string) => {
    if (!selectedDate) return

    setAnotandoEspera(true)
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/lista-espera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: formatFecha(selectedDate),
          hora
        })
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: data.mensaje || 'Te anotaste en la lista de espera' })
        loadMisEsperas()
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al anotarse' })
    } finally {
      setAnotandoEspera(false)
    }
  }

  const salirDeEspera = async (id: string) => {
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/lista-espera?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Saliste de la lista de espera' })
        loadMisEsperas()
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al salir de la lista' })
    }
  }

  // Verificar si estoy en espera para un slot específico
  const getEsperaParaSlot = (fecha: string, hora: string) => {
    return misEsperas.find(e => e.fecha === fecha && e.hora === hora)
  }

  // Generar días del calendario
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const hasDayHorario = (date: Date) => {
    const dayOfWeek = date.getDay()
    return profesor.horarios.some(h => h.diaSemana === dayOfWeek)
  }

  // Vista de reservas (usuario siempre logueado - verificado en server)
  return (
    <div className="portal-container">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-content">
          <h1>{profesor.nombre}</h1>
          {profesor.descripcion && <p>{profesor.descripcion}</p>}
        </div>
        <div className="portal-header-actions">
          <div className="portal-user-info">
            <User size={16} />
            <span>{session?.user?.name || session?.user?.email}</span>
          </div>
          <button
            className="portal-logout-btn"
            onClick={() => signOut({ callbackUrl: `/reservar/${profesor.slug}` })}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`portal-message ${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="portal-content">
        {/* Mis reservas */}
        {misReservas.length > 0 && (
          <section className="portal-section">
            <h2>Mis próximas clases</h2>
            <div className="portal-reservas-list">
              {misReservas.map(r => (
                <div key={r.id} className="portal-reserva-card">
                  <div className="portal-reserva-info">
                    <Calendar size={16} />
                    <span>{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <Clock size={16} />
                    <span>{r.hora}</span>
                  </div>
                  <button
                    className="portal-cancel-btn"
                    onClick={() => cancelarReserva(r.id)}
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mis esperas */}
        {misEsperas.length > 0 && (
          <section className="portal-section">
            <h2>En lista de espera</h2>
            <div className="portal-reservas-list">
              {misEsperas.map(e => (
                <div key={e.id} className="portal-reserva-card waiting">
                  <div className="portal-reserva-info">
                    <Bell size={16} />
                    <span>Posición {e.posicion}</span>
                    <Calendar size={16} />
                    <span>{new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <Clock size={16} />
                    <span>{e.hora}</span>
                  </div>
                  <button
                    className="portal-cancel-btn"
                    onClick={() => salirDeEspera(e.id)}
                  >
                    Salir
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Calendario */}
        <section className="portal-section">
          <h2>Seleccioná una fecha</h2>
          <div className="portal-calendar">
            <div className="portal-calendar-header">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                <ChevronLeft size={20} />
              </button>
              <span>{MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="portal-calendar-days-header">
              {DIAS_SEMANA.map(d => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="portal-calendar-grid">
              {getDaysInMonth().map((day, i) => (
                <button
                  key={i}
                  className={`portal-calendar-day ${
                    day === null ? 'empty' : ''
                  } ${
                    day && !isDateAvailable(day) ? 'past' : ''
                  } ${
                    day && profesor.horarios.length > 0 && !hasDayHorario(day) ? 'no-horario' : ''
                  } ${
                    day && selectedDate && formatFecha(day) === formatFecha(selectedDate) ? 'selected' : ''
                  }`}
                  disabled={!day || !isDateAvailable(day) || (profesor.horarios.length > 0 && !hasDayHorario(day))}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Horarios disponibles */}
        {selectedDate && (
          <section className="portal-section">
            <h2>
              Horarios para el {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {loading ? (
              <div className="portal-loading">Cargando horarios...</div>
            ) : slots.length === 0 ? (
              <div className="portal-empty">No hay horarios disponibles para esta fecha</div>
            ) : (
              <div className="portal-slots-grid">
                {slots.map(slot => {
                  const fechaStr = selectedDate ? formatFecha(selectedDate) : ''
                  const esperaExistente = getEsperaParaSlot(fechaStr, slot.hora)

                  if (slot.disponible) {
                    return (
                      <button
                        key={slot.hora}
                        className="portal-slot available"
                        disabled={reservando}
                        onClick={() => reservar(slot.hora)}
                      >
                        <span className="portal-slot-time">{slot.hora}</span>
                        <span className="portal-slot-status">
                          {slot.maxAlumnos - slot.ocupados} lugar{slot.maxAlumnos - slot.ocupados !== 1 ? 'es' : ''}
                        </span>
                      </button>
                    )
                  }

                  // Slot lleno
                  if (esperaExistente) {
                    return (
                      <div key={slot.hora} className="portal-slot waiting">
                        <span className="portal-slot-time">{slot.hora}</span>
                        <span className="portal-slot-status">
                          <Bell size={14} />
                          Posición {esperaExistente.posicion}
                        </span>
                        <button
                          className="portal-slot-cancel-wait"
                          onClick={() => salirDeEspera(esperaExistente.id)}
                        >
                          Salir
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div key={slot.hora} className="portal-slot full">
                      <span className="portal-slot-time">{slot.hora}</span>
                      <span className="portal-slot-status">Completo</span>
                      <button
                        className="portal-slot-waitlist"
                        disabled={anotandoEspera}
                        onClick={() => anotarseEnEspera(slot.hora)}
                      >
                        <Bell size={14} />
                        Lista de espera
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Packs disponibles */}
        {profesor.packs.length > 0 && (
          <section className="portal-section">
            <h2>Planes disponibles</h2>
            <div className="portal-packs-grid">
              {profesor.packs.map(pack => (
                <div key={pack.id} className="portal-pack-card">
                  <h3>{pack.nombre}</h3>
                  <p className="portal-pack-clases">{pack.clasesPorSemana} clase{pack.clasesPorSemana !== 1 ? 's' : ''}/semana</p>
                  <p className="portal-pack-price">{formatPrecio(pack.precio)}<span>/mes</span></p>
                </div>
              ))}
            </div>
            {parseFloat(profesor.config.precioPorClase) > 0 && (
              <p className="portal-clase-suelta">
                Clase suelta: {formatPrecio(profesor.config.precioPorClase)}
              </p>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="portal-footer">
        <p>Reservá con anticipación mínima de {profesor.config.horasAnticipacionMinima} hora{profesor.config.horasAnticipacionMinima !== 1 ? 's' : ''}</p>
      </footer>
    </div>
  )
}
