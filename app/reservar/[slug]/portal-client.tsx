'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, X, User, LogOut } from 'lucide-react'
import Link from 'next/link'
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
const DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
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
  const { data: session, status } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const isLoggedIn = status === 'authenticated' && session?.user

  // Cargar slots cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && isLoggedIn) {
      loadSlots(selectedDate)
    }
  }, [selectedDate, isLoggedIn])

  // Cargar mis reservas si estoy logueado
  useEffect(() => {
    if (isLoggedIn) {
      loadMisReservas()
    }
  }, [isLoggedIn])

  const loadSlots = async (fecha: Date) => {
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
  }

  const loadMisReservas = async () => {
    try {
      const res = await fetch(`/api/portal/${profesor.slug}/reservar`)
      const data = await res.json()
      if (data.reservas) {
        setMisReservas(data.reservas)
      }
    } catch (error) {
      console.error('Error loading reservas:', error)
    }
  }

  const reservar = async (hora: string) => {
    if (!isLoggedIn || !selectedDate) return

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

  // Agrupar horarios por día
  const horariosPorDia = profesor.horarios.reduce((acc, h) => {
    if (!acc[h.diaSemana]) acc[h.diaSemana] = []
    acc[h.diaSemana].push(h)
    return acc
  }, {} as Record<number, Horario[]>)

  // Vista para usuario NO logueado - Landing page del profesor
  if (!isLoggedIn) {
    return (
      <div className="portal-container">
        <div className="portal-landing">
          {/* Header con nombre del profesor */}
          <header className="portal-landing-header">
            <h1>{profesor.nombre}</h1>
            {profesor.descripcion && <p className="portal-landing-desc">{profesor.descripcion}</p>}
          </header>

          {/* CTA principal */}
          <section className="portal-cta-section">
            <h2>Reservá tu clase</h2>
            <p>Ingresá a tu cuenta para ver los horarios disponibles y reservar.</p>
            <div className="portal-cta-buttons">
              <Link href={`/login?callbackUrl=/reservar/${profesor.slug}`} className="portal-btn-primary">
                Iniciar sesión
              </Link>
              <Link href={`/login?callbackUrl=/reservar/${profesor.slug}`} className="portal-btn-secondary">
                Crear cuenta
              </Link>
            </div>
          </section>

          {/* Info de horarios disponibles */}
          {Object.keys(horariosPorDia).length > 0 && (
            <section className="portal-section">
              <h2>Horarios de clases</h2>
              <div className="portal-horarios-grid">
                {Object.entries(horariosPorDia)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([dia, horarios]) => (
                    <div key={dia} className="portal-horario-card">
                      <h3>{DIAS_SEMANA_LARGO[Number(dia)]}</h3>
                      <div className="portal-horario-times">
                        {horarios.map(h => (
                          <span key={h.id}>{h.horaInicio} - {h.horaFin}</span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
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

          {/* Footer */}
          <footer className="portal-footer">
            <p>Reservá con anticipación mínima de {profesor.config.horasAnticipacionMinima} hora{profesor.config.horasAnticipacionMinima !== 1 ? 's' : ''}</p>
          </footer>
        </div>
      </div>
    )
  }

  // Vista para usuario LOGUEADO - Sistema de reservas
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
            <span>{session.user?.name || session.user?.email}</span>
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
                {slots.map(slot => (
                  <button
                    key={slot.hora}
                    className={`portal-slot ${slot.disponible ? 'available' : 'full'}`}
                    disabled={!slot.disponible || reservando}
                    onClick={() => reservar(slot.hora)}
                  >
                    <span className="portal-slot-time">{slot.hora}</span>
                    <span className="portal-slot-status">
                      {slot.disponible
                        ? `${slot.maxAlumnos - slot.ocupados} lugar${slot.maxAlumnos - slot.ocupados !== 1 ? 'es' : ''}`
                        : 'Completo'
                      }
                    </span>
                  </button>
                ))}
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
