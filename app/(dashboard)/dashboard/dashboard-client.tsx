'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RotateCcw, Users, Calendar, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { changeAsistenciaAPI } from '@/lib/api'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import type { ClaseHoy, SiguienteClase } from '@/lib/types'
import { formatearHora, getErrorMessage } from '@/lib/utils'

interface DashboardClientProps {
  clasesHoy: ClaseHoy[]
  totalAlumnos: number
  horarioTardeInicio: string
  maxAlumnosPorClase: number
  siguienteClase: SiguienteClase | null
}

function getMinutosHasta(horaClase: string): number {
  const ahora = new Date()
  const [horas, minutos] = horaClase.split(':').map(Number)
  const claseTime = new Date()
  claseTime.setHours(horas, minutos, 0, 0)
  const diffMs = claseTime.getTime() - ahora.getTime()
  return Math.floor(diffMs / 60000)
}

function getTimeStatus(minutosHasta: number): { isPast: boolean; isNow: boolean; isSoon: boolean } {
  if (minutosHasta < -60) {
    return { isPast: true, isNow: false, isSoon: false }
  } else if (minutosHasta < 0) {
    return { isPast: false, isNow: true, isSoon: false }
  } else if (minutosHasta <= 30) {
    return { isPast: false, isNow: false, isSoon: true }
  }
  return { isPast: false, isNow: false, isSoon: false }
}

export function DashboardClient({ clasesHoy, totalAlumnos, horarioTardeInicio, maxAlumnosPorClase, siguienteClase }: DashboardClientProps) {
  const { showSuccess, showError } = useToast()
  const [clases, setClases] = useState(clasesHoy)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Determinar si una hora es de mañana o tarde
  const horaTardeNum = parseInt(horarioTardeInicio.split(':')[0])

  // Calcular ocupación por turno
  const ocupacionTurnos = useMemo(() => {
    const manana = { alumnos: 0, capacidad: 0 }
    const tarde = { alumnos: 0, capacidad: 0 }

    // Agrupar clases por hora única para contar horarios
    const horasUnicas = new Set<string>()
    for (const clase of clases) {
      horasUnicas.add(clase.horaInicio.slice(0, 5))
    }

    // Por cada hora, sumar capacidad y alumnos
    for (const hora of horasUnicas) {
      const horaNum = parseInt(hora.split(':')[0])
      const esTarde = horaNum >= horaTardeNum
      const clasesEnHora = clases.filter(c => c.horaInicio.slice(0, 5) === hora)
      const alumnosEnHora = clasesEnHora.filter(c => c.alumno !== null).length

      if (esTarde) {
        tarde.capacidad += maxAlumnosPorClase
        tarde.alumnos += alumnosEnHora
      } else {
        manana.capacidad += maxAlumnosPorClase
        manana.alumnos += alumnosEnHora
      }
    }

    return { manana, tarde }
  }, [clases, horaTardeNum, maxAlumnosPorClase])

  // Agrupar clases por hora, ordenando pendientes primero
  const horasAgrupadas = useMemo(() => {
    const grupos = new Map<string, ClaseHoy[]>()

    const sorted = [...clases].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

    for (const clase of sorted) {
      const hora = clase.horaInicio.slice(0, 5) // "09:00"
      if (!grupos.has(hora)) {
        grupos.set(hora, [])
      }
      grupos.get(hora)!.push(clase)
    }

    // Ordenar dentro de cada grupo: pendientes primero, marcados después
    return Array.from(grupos.entries()).map(([hora, clasesGrupo]) => ({
      hora,
      clases: clasesGrupo.sort((a, b) => {
        const aFinalizada = a.asistencia === 'presente' || a.asistencia === 'ausente' || a.estado === 'cancelada'
        const bFinalizada = b.asistencia === 'presente' || b.asistencia === 'ausente' || b.estado === 'cancelada'
        if (aFinalizada && !bFinalizada) return 1  // a va después
        if (!aFinalizada && bFinalizada) return -1 // a va antes
        return 0
      })
    }))
  }, [clases])

  // Encontrar el grupo actual/próximo
  const currentGroupIndex = useMemo(() => {
    for (let i = 0; i < horasAgrupadas.length; i++) {
      const minutosHasta = getMinutosHasta(horasAgrupadas[i].hora)
      if (minutosHasta >= -60) {
        return i
      }
    }
    return horasAgrupadas.length - 1
  }, [horasAgrupadas])

  async function handleMarcarAsistencia(claseId: string, nuevaAsistencia: 'presente' | 'ausente' | 'pendiente') {
    setLoadingId(claseId)

    // Guardar asistencia anterior para revert
    const claseAnterior = clases.find(c => c.id === claseId)
    const asistenciaAnterior = claseAnterior?.asistencia || 'pendiente'

    // Optimistic update
    setClases(prev => prev.map(c =>
      c.id === claseId ? { ...c, asistencia: nuevaAsistencia } : c
    ))

    try {
      await changeAsistenciaAPI(claseId, nuevaAsistencia)
      const mensajes = {
        presente: 'Presente',
        ausente: 'Ausente',
        pendiente: 'Desmarcado'
      }
      showSuccess(mensajes[nuevaAsistencia])
      invalidateCache(CACHE_KEYS.DASHBOARD)
      invalidateCache(CACHE_KEYS.CALENDARIO)
    } catch (err) {
      // Revert on error
      setClases(prev => prev.map(c =>
        c.id === claseId ? { ...c, asistencia: asistenciaAnterior } : c
      ))
      showError(getErrorMessage(err) || 'Error al actualizar')
    } finally {
      setLoadingId(null)
    }
  }

  // Contar stats (basado en asistencia, no en estado)
  const presentes = clases.filter(c => c.asistencia === 'presente').length
  const pendientes = clases.filter(c => c.asistencia === 'pendiente' && c.estado !== 'cancelada').length
  const ausentes = clases.filter(c => c.asistencia === 'ausente').length

  // Función para renderizar cada clase
  function renderClaseItem(clase: ClaseHoy, _isPastGroup: boolean) {
    const isLoading = loadingId === clase.id
    const esPresente = clase.asistencia === 'presente'
    const esAusente = clase.asistencia === 'ausente'
    const esCancelada = clase.estado === 'cancelada'
    const yaMarcada = esPresente || esAusente || esCancelada

    return (
      <div key={clase.id} className={`dash-clase-item ${clase.asistencia}`}>
        <div className="dash-clase-info">
          <span className="dash-clase-nombre">
            {clase.alumno?.nombre || 'Disponible'}
          </span>
          {clase.esClasePrueba && (
            <span className="dash-clase-tag prueba">Prueba</span>
          )}
        </div>
        <div className="dash-clase-actions">
          {clase.alumno && !yaMarcada && (
            <>
              <button
                className="dash-action-btn confirm"
                onClick={() => handleMarcarAsistencia(clase.id, 'presente')}
                disabled={isLoading}
              >
                Presente
              </button>
              <button
                className="dash-action-btn absent"
                onClick={() => handleMarcarAsistencia(clase.id, 'ausente')}
                disabled={isLoading}
              >
                Ausente
              </button>
            </>
          )}
          {esPresente && (
            <button
              className="dash-status-btn done"
              onClick={() => handleMarcarAsistencia(clase.id, 'pendiente')}
              disabled={isLoading}
              title="Desmarcar"
            >
              <span>Presente</span>
              <RotateCcw size={14} />
            </button>
          )}
          {esAusente && (
            <button
              className="dash-status-btn absent"
              onClick={() => handleMarcarAsistencia(clase.id, 'pendiente')}
              disabled={isLoading}
              title="Desmarcar"
            >
              <span>Ausente</span>
              <RotateCcw size={14} />
            </button>
          )}
          {esCancelada && (
            <span className="dash-status-label cancelled">Cancelada</span>
          )}
        </div>
      </div>
    )
  }

  // Calcular porcentajes de ocupación
  const porcentajeManana = ocupacionTurnos.manana.capacidad > 0
    ? Math.round((ocupacionTurnos.manana.alumnos / ocupacionTurnos.manana.capacidad) * 100)
    : 0
  const porcentajeTarde = ocupacionTurnos.tarde.capacidad > 0
    ? Math.round((ocupacionTurnos.tarde.alumnos / ocupacionTurnos.tarde.capacidad) * 100)
    : 0

  return (
    <div className="dash-content">
      {/* Tarjetas de ocupación por turno */}
      <div className="dash-resumen">
        {ocupacionTurnos.manana.capacidad > 0 && (
          <div className="dash-turno-card manana">
            <div className="dash-turno-header">
              <span className="dash-turno-label">Mañana</span>
              <span className="dash-turno-ocupacion">
                {ocupacionTurnos.manana.alumnos}/{ocupacionTurnos.manana.capacidad}
              </span>
            </div>
            <div className="dash-turno-bar">
              <div
                className="dash-turno-bar-fill"
                style={{ width: `${porcentajeManana}%` }}
              />
            </div>
          </div>
        )}
        {ocupacionTurnos.tarde.capacidad > 0 && (
          <div className="dash-turno-card tarde">
            <div className="dash-turno-header">
              <span className="dash-turno-label">Tarde</span>
              <span className="dash-turno-ocupacion">
                {ocupacionTurnos.tarde.alumnos}/{ocupacionTurnos.tarde.capacidad}
              </span>
            </div>
            <div className="dash-turno-bar">
              <div
                className="dash-turno-bar-fill"
                style={{ width: `${porcentajeTarde}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats inline */}
      <div className="dash-stats-inline">
        <span className="dash-stat-pill">
          <strong>{clases.length}</strong> clases
        </span>
        <span className="dash-stat-pill success">
          <strong>{presentes}</strong> presentes
        </span>
        {pendientes > 0 && (
          <span className="dash-stat-pill">
            <strong>{pendientes}</strong> pendientes
          </span>
        )}
        {ausentes > 0 && (
          <span className="dash-stat-pill warning">
            <strong>{ausentes}</strong> ausentes
          </span>
        )}
      </div>

      {/* Clase actual/próxima de HOY */}
      {horasAgrupadas.length > 0 && currentGroupIndex < horasAgrupadas.length && (() => {
        const grupo = horasAgrupadas[currentGroupIndex]
        const minutosHasta = getMinutosHasta(grupo.hora)
        const { isNow, isSoon } = getTimeStatus(minutosHasta)

        // Verificar si esta es la última clase del día y ya pasó
        const esUltimaClase = currentGroupIndex === horasAgrupadas.length - 1
        const nextGroupIndex = currentGroupIndex + 1
        const hayMasHoy = nextGroupIndex < horasAgrupadas.length
        const mostrarSeccionHoy = esUltimaClase && !hayMasHoy && siguienteClase

        return (
          <>
            {mostrarSeccionHoy && <div className="dash-section-header">Hoy</div>}
            <div className={`dash-hora-group current ${isNow ? 'now' : ''} ${isSoon ? 'soon' : ''}`}>
              <div className="dash-hora-header">
                <span className="dash-hora-time">{formatearHora(grupo.hora)}</span>
                {isNow && <span className="dash-hora-badge now">En curso</span>}
                {isSoon && !isNow && <span className="dash-hora-badge soon">Próxima</span>}
              </div>
              <div className="dash-hora-clases">
                {grupo.clases.map(clase => renderClaseItem(clase, false))}
              </div>
            </div>
          </>
        )
      })()}

      {/* Siguiente clase (hoy o mañana) */}
      {(() => {
        // Buscar siguiente clase de hoy (después de la actual)
        const nextGroupIndex = currentGroupIndex + 1
        const hayMasHoy = nextGroupIndex < horasAgrupadas.length

        if (hayMasHoy) {
          const grupo = horasAgrupadas[nextGroupIndex]
          const cantAlumnos = grupo.clases.filter(c => c.alumno !== null).length
          return (
            <>
              <div className="dash-section-header">Siguiente</div>
              <div className="dash-siguiente-card">
                <div className="dash-siguiente-info">
                  <span className="dash-siguiente-hora">{formatearHora(grupo.hora)}</span>
                  <span className="dash-siguiente-alumnos">{cantAlumnos} {cantAlumnos === 1 ? 'alumno' : 'alumnos'}</span>
                </div>
              </div>
            </>
          )
        } else if (siguienteClase) {
          return (
            <>
              <div className="dash-section-header">Mañana</div>
              <div className="dash-siguiente-card tomorrow">
                <div className="dash-siguiente-info">
                  <span className="dash-siguiente-hora">{formatearHora(siguienteClase.hora)}</span>
                  <span className="dash-siguiente-alumnos">{siguienteClase.cantAlumnos} {siguienteClase.cantAlumnos === 1 ? 'alumno' : 'alumnos'}</span>
                </div>
              </div>
            </>
          )
        }
        return null
      })()}

      {/* Quick Links */}
      <div className="dash-quick-links">
        <Link href="/alumnos" className="dash-quick-link">
          <Users size={18} />
          <span>{totalAlumnos} alumnos</span>
          <ChevronRight size={16} />
        </Link>
        <Link href="/calendario" className="dash-quick-link">
          <Calendar size={18} />
          <span>Ver calendario completo</span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}
