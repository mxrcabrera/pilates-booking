'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronDown, ChevronUp, ArrowRight, Users, DollarSign, AlertCircle } from 'lucide-react'
import type { ClaseHoy } from '@/lib/types'

type ClasesPorTurno = {
  mañana: ClaseHoy[]
  tarde: ClaseHoy[]
  noche: ClaseHoy[]
}

interface DashboardClientProps {
  clasesHoy: ClaseHoy[]
  totalAlumnos: number
  pagosVencidos: number
}

function getTurno(hora: number): 'mañana' | 'tarde' | 'noche' {
  if (hora < 12) return 'mañana'
  if (hora < 19) return 'tarde'
  return 'noche'
}

function formatearHora(hora: string): string {
  return hora.substring(0, 5)
}

function getMinutosHasta(horaClase: string): number {
  const ahora = new Date()
  const [horas, minutos] = horaClase.split(':').map(Number)
  const claseTime = new Date()
  claseTime.setHours(horas, minutos, 0, 0)

  const diffMs = claseTime.getTime() - ahora.getTime()
  return Math.floor(diffMs / 60000)
}

function getTimeStatus(minutosHasta: number): { text: string; isPast: boolean; isNow: boolean } {
  if (minutosHasta < -60) {
    return { text: 'Finalizada', isPast: true, isNow: false }
  } else if (minutosHasta < 0) {
    return { text: 'En curso', isPast: false, isNow: true }
  } else if (minutosHasta < 60) {
    return { text: `Comienza en ${minutosHasta} min`, isPast: false, isNow: false }
  } else {
    const horas = Math.floor(minutosHasta / 60)
    return { text: `En ${horas}h ${minutosHasta % 60}min`, isPast: false, isNow: false }
  }
}

export function DashboardClient({ clasesHoy, totalAlumnos, pagosVencidos }: DashboardClientProps) {
  const [expandedTurnos, setExpandedTurnos] = useState<Set<string>>(new Set())

  // Agrupar por turno
  const clasesPorTurno: ClasesPorTurno = {
    mañana: [],
    tarde: [],
    noche: []
  }

  clasesHoy.forEach(clase => {
    const hora = parseInt(clase.horaInicio.split(':')[0])
    const turno = getTurno(hora)
    clasesPorTurno[turno].push(clase)
  })

  // Ordenar por hora
  Object.values(clasesPorTurno).forEach(grupo => {
    grupo.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  })

  // Encontrar próxima clase
  const ahora = new Date()
  const horaActual = ahora.getHours()
  const minutoActual = ahora.getMinutes()
  const tiempoActual = horaActual * 60 + minutoActual

  const proximaClase = clasesHoy
    .filter(clase => {
      const [h, m] = clase.horaInicio.split(':').map(Number)
      const tiempoClase = h * 60 + m
      return tiempoClase >= tiempoActual - 60 // Incluir clases que empezaron hace menos de 1h
    })
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))[0]

  const toggleTurno = (turno: string) => {
    const newExpanded = new Set(expandedTurnos)
    if (newExpanded.has(turno)) {
      newExpanded.delete(turno)
    } else {
      newExpanded.add(turno)
    }
    setExpandedTurnos(newExpanded)
  }

  const getTurnoEmoji = (turno: string) => {
    if (turno === 'mañana') return '☀️'
    if (turno === 'tarde') return '☀️'
    return '🌙'
  }

  const getTurnoLabel = (turno: string) => {
    if (turno === 'mañana') return 'Mañana'
    if (turno === 'tarde') return 'Tarde'
    return 'Noche'
  }

  const renderTurnoSection = (turno: 'mañana' | 'tarde' | 'noche') => {
    const clases = clasesPorTurno[turno]
    if (clases.length === 0) return null

    const isExpanded = expandedTurnos.has(turno)
    const visibleClases = isExpanded ? clases : clases.slice(0, 2)
    const hasMore = clases.length > 2

    return (
      <div key={turno} className="dashboard-turno-section">
        <div className="dashboard-turno-header">
          <div className="dashboard-turno-title">
            <span className="dashboard-turno-emoji">{getTurnoEmoji(turno)}</span>
            <h3 className="dashboard-turno-name">
              {getTurnoLabel(turno)} ({clases.length})
            </h3>
          </div>
          {hasMore && (
            <button
              onClick={() => toggleTurno(turno)}
              className="dashboard-turno-toggle"
            >
              {isExpanded ? (
                <>
                  <span>Ver menos</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>+{clases.length - 2} más</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="dashboard-clases-compact">
          {visibleClases.map(clase => {
            const minutosHasta = getMinutosHasta(clase.horaInicio)
            const isProxima = proximaClase?.id === clase.id
            const timeStatus = getTimeStatus(minutosHasta)

            return (
              <div
                key={clase.id}
                className={`dashboard-clase-compact ${isProxima ? 'is-next' : ''} ${timeStatus.isPast ? 'is-past' : ''}`}
              >
                <div className="dashboard-clase-compact-time">
                  {formatearHora(clase.horaInicio)}
                </div>
                <div className="dashboard-clase-compact-info">
                  <div className="dashboard-clase-compact-name">
                    {clase.alumno?.nombre || 'Disponible'}
                  </div>
                  {isProxima && !timeStatus.isPast && (
                    <div className="dashboard-clase-compact-badge">
                      {timeStatus.text}
                    </div>
                  )}
                </div>
                <div>
                  <span className={`status-badge ${clase.estado}`}>
                    {clase.estado === 'reservada' && 'R'}
                    {clase.estado === 'completada' && 'C'}
                    {clase.estado === 'cancelada' && 'X'}
                    {clase.estado === 'ausente' && 'A'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (clasesHoy.length === 0) {
    return null
  }

  return (
    <div className="dashboard-agenda-section">
      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <Link href="/alumnos" className="dashboard-stat-card">
          <Users className="w-5 h-5" style={{ color: 'rgba(139, 92, 246, 0.9)' }} />
          <div className="dashboard-stat-value">{totalAlumnos}</div>
          <div className="dashboard-stat-label">Alumnos</div>
        </Link>

        <Link href="/pagos" className={`dashboard-stat-card ${pagosVencidos > 0 ? 'has-alert' : ''}`}>
          <DollarSign className="w-5 h-5" style={{ color: pagosVencidos > 0 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)' }} />
          <div className="dashboard-stat-value">{pagosVencidos}</div>
          <div className="dashboard-stat-label">Pagos vencidos</div>
          {pagosVencidos > 0 && <AlertCircle className="dashboard-stat-alert" />}
        </Link>
      </div>

      {/* Next Up Card */}
      {proximaClase && (
        <div className="dashboard-next-card">
          <div className="dashboard-next-header">
            <Clock className="w-5 h-5" />
            <span className="dashboard-next-label">
              {getTimeStatus(getMinutosHasta(proximaClase.horaInicio)).isNow ? 'EN CURSO' : 'PRÓXIMA CLASE'}
            </span>
          </div>

          <div className="dashboard-next-time">
            {formatearHora(proximaClase.horaInicio)}
          </div>

          <div className="dashboard-next-alumno">
            {proximaClase.alumno?.nombre || 'Disponible'}
          </div>

          {proximaClase.esClasePrueba && (
            <div className="dashboard-next-badge-prueba">
              Clase de prueba
            </div>
          )}

          <div className="dashboard-next-countdown">
            {getTimeStatus(getMinutosHasta(proximaClase.horaInicio)).text}
          </div>
        </div>
      )}

      {/* Resumen Pills */}
      <div className="dashboard-turnos-pills">
        {clasesPorTurno.mañana.length > 0 && (
          <div className="dashboard-turno-pill">
            <span className="dashboard-pill-emoji">☀️</span>
            <span className="dashboard-pill-count">{clasesPorTurno.mañana.length}</span>
          </div>
        )}
        {clasesPorTurno.tarde.length > 0 && (
          <div className="dashboard-turno-pill">
            <span className="dashboard-pill-emoji">☀️</span>
            <span className="dashboard-pill-count">{clasesPorTurno.tarde.length}</span>
          </div>
        )}
        {clasesPorTurno.noche.length > 0 && (
          <div className="dashboard-turno-pill">
            <span className="dashboard-pill-emoji">🌙</span>
            <span className="dashboard-pill-count">{clasesPorTurno.noche.length}</span>
          </div>
        )}
      </div>

      {/* Turnos Sections */}
      <div className="dashboard-turnos-list">
        {renderTurnoSection('mañana')}
        {renderTurnoSection('tarde')}
        {renderTurnoSection('noche')}
      </div>

      {/* Ver día completo */}
      <Link href="/calendario" className="dashboard-view-all">
        <span>Ver día completo</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
