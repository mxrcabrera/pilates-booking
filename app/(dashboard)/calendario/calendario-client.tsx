'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaseDialog } from './clase-dialog'
import { ClaseDetailDialog } from './clase-detail-dialog'

type Clase = {
  id: string
  fecha: Date
  horaInicio: string
  horaRecurrente: string | null
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  diasSemana: number[]
  profesoraId: string
  alumna: {
    id: string
    nombre: string
  } | null
  profesora: {
    id: string
    nombre: string
  }
}

type Alumna = {
  id: string
  nombre: string
}

interface CalendarioClientProps {
  clasesIniciales: Clase[]
  alumnas: Alumna[]
  currentUserId: string
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
}

type Vista = 'dia' | 'semana'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_SEMANA_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const HORAS_DIA = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 a 21:00

function getTurno(hora: number): 'mañana' | 'tarde' | 'noche' {
  if (hora < 12) return 'mañana'
  if (hora < 19) return 'tarde'
  return 'noche'
}

function formatearHora(hora: string): string {
  return hora.substring(0, 5) // "08:00:00" → "08:00"
}

function formatearFechaDia(fecha: Date): string {
  return fecha.toISOString().split('T')[0]
}

export function CalendarioClient({ clasesIniciales, alumnas, currentUserId, horarioMananaInicio, horarioMananaFin, horarioTardeInicio, horarioTardeFin }: CalendarioClientProps) {
  const router = useRouter()
  const [clases, setClases] = useState<Clase[]>(clasesIniciales)
  const [fechaActual, setFechaActual] = useState(new Date())
  const [vista, setVista] = useState<Vista>('dia')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null)

  // Sincronizar estado local cuando cambian las props (después del refresh)
  useEffect(() => {
    setClases(clasesIniciales)
  }, [clasesIniciales])

  // Navegar fecha
  const irDiaAnterior = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() - 1)
    setFechaActual(nuevaFecha)
  }

  const irDiaSiguiente = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() + 1)
    setFechaActual(nuevaFecha)
  }

  const irSemanaAnterior = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() - 7)
    setFechaActual(nuevaFecha)
  }

  const irSemanaSiguiente = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() + 7)
    setFechaActual(nuevaFecha)
  }

  const irHoy = () => {
    setFechaActual(new Date())
  }

  // Obtener clases del día seleccionado
  const clasesDelDia = useMemo(() => {
    const fechaStr = formatearFechaDia(fechaActual)
    return clases.filter(clase => formatearFechaDia(clase.fecha) === fechaStr)
  }, [clases, fechaActual])

  // Obtener clases de la semana
  const clasesDeLaSemana = useMemo(() => {
    const inicioSemana = new Date(fechaActual)
    inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay()) // Ir al domingo

    const diasSemana = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(inicioSemana)
      fecha.setDate(inicioSemana.getDate() + i)
      return fecha
    })

    return diasSemana.map(fecha => {
      const fechaStr = formatearFechaDia(fecha)
      return {
        fecha,
        clases: clases.filter(clase => formatearFechaDia(clase.fecha) === fechaStr)
      }
    })
  }, [clases, fechaActual])

  // Agrupar clases por turno
  const clasesPorTurno = useMemo(() => {
    const grupos = {
      mañana: [] as Clase[],
      tarde: [] as Clase[],
      noche: [] as Clase[]
    }

    clasesDelDia.forEach(clase => {
      const hora = parseInt(clase.horaInicio.split(':')[0])
      const turno = getTurno(hora)
      grupos[turno].push(clase)
    })

    // Ordenar por hora dentro de cada turno
    Object.values(grupos).forEach(grupo => {
      grupo.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    })

    return grupos
  }, [clasesDelDia])

  const handleClaseClick = (clase: Clase) => {
    setClaseSeleccionada(clase)
    setDetailDialogOpen(true)
  }

  const handleEdit = () => {
    setDetailDialogOpen(false)
    setEditDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    router.refresh()
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setDetailDialogOpen(false)
    setClaseSeleccionada(null)
    router.refresh()
  }

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false)
    setClaseSeleccionada(null)
    router.refresh()
  }

  const formatearFecha = (fecha: Date) => {
    const dia = DIAS_SEMANA_FULL[fecha.getDay()]
    const num = fecha.getDate()
    const mes = MESES[fecha.getMonth()].substring(0, 3)
    return `${dia}, ${num} ${mes}`
  }

  const formatearFechaCorta = (fecha: Date) => {
    const dia = DIAS_SEMANA[fecha.getDay()]
    const num = fecha.getDate()
    return `${dia} ${num}`
  }

  return (
    <>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Calendario</h1>
            <p className="page-subtitle">Gestiona tus clases y horarios</p>
          </div>
          <Button className="btn-primary desktop-only" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva Clase
          </Button>
        </div>

        {/* Vista Mobile: Lista Diaria */}
        <div className="mobile-only">
          <div className="content-card">
            {/* Navegación de fecha */}
            <div className="calendar-mobile-nav">
              <button
                onClick={irDiaAnterior}
                className="calendar-nav-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="calendar-date-header">
                <h2 className="calendar-date-title">
                  {formatearFecha(fechaActual)}
                </h2>
                <button
                  onClick={irHoy}
                  className="calendar-today-btn"
                >
                  Ir a hoy
                </button>
              </div>

              <button
                onClick={irDiaSiguiente}
                className="calendar-nav-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Clases del día */}
            {clasesDelDia.length === 0 ? (
              <div className="empty-state-small">
                <CalendarIcon className="w-12 h-12" />
                <p>No hay clases programadas</p>
                <p className="text-sm text-white/40 mt-1">para este día</p>
              </div>
            ) : (
              <div className="calendar-turnos-container">
                {/* Mañana */}
                {clasesPorTurno.mañana.length > 0 && (
                  <div>
                    <div className="turno-section-header">
                      <h3 className="turno-section-title">
                        Mañana ({clasesPorTurno.mañana.length})
                      </h3>
                    </div>
                    <div className="turno-clases-list">
                      {clasesPorTurno.mañana.map(clase => (
                        <button
                          key={clase.id}
                          onClick={() => handleClaseClick(clase)}
                          className={`clase-item-mobile ${clase.profesoraId !== currentUserId ? 'clase-compartida' : ''}`}
                        >
                          <div className="clase-time-mobile">
                            <div className="clase-time-text">
                              {formatearHora(clase.horaInicio)}
                            </div>
                          </div>
                          <div className="clase-info-mobile">
                            <div className="clase-alumna-name">
                              {clase.profesoraId !== currentUserId && (
                                <span className="profesora-badge">
                                  {clase.profesora.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              )}
                              {clase.alumna?.nombre || 'Disponible'}
                            </div>
                            {clase.esClasePrueba && (
                              <div className="clase-prueba-label">
                                Clase de prueba
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
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarde */}
                {clasesPorTurno.tarde.length > 0 && (
                  <div>
                    <div className="turno-section-header">
                      <h3 className="turno-section-title">
                        Tarde ({clasesPorTurno.tarde.length})
                      </h3>
                    </div>
                    <div className="turno-clases-list">
                      {clasesPorTurno.tarde.map(clase => (
                        <button
                          key={clase.id}
                          onClick={() => handleClaseClick(clase)}
                          className={`clase-item-mobile ${clase.profesoraId !== currentUserId ? 'clase-compartida' : ''}`}
                        >
                          <div className="clase-time-mobile">
                            <div className="clase-time-text">
                              {formatearHora(clase.horaInicio)}
                            </div>
                          </div>
                          <div className="clase-info-mobile">
                            <div className="clase-alumna-name">
                              {clase.profesoraId !== currentUserId && (
                                <span className="profesora-badge">
                                  {clase.profesora.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              )}
                              {clase.alumna?.nombre || 'Disponible'}
                            </div>
                            {clase.esClasePrueba && (
                              <div className="clase-prueba-label">
                                Clase de prueba
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
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Noche */}
                {clasesPorTurno.noche.length > 0 && (
                  <div>
                    <div className="turno-section-header">
                      <h3 className="turno-section-title">
                        Noche ({clasesPorTurno.noche.length})
                      </h3>
                    </div>
                    <div className="turno-clases-list">
                      {clasesPorTurno.noche.map(clase => (
                        <button
                          key={clase.id}
                          onClick={() => handleClaseClick(clase)}
                          className={`clase-item-mobile ${clase.profesoraId !== currentUserId ? 'clase-compartida' : ''}`}
                        >
                          <div className="clase-time-mobile">
                            <div className="clase-time-text">
                              {formatearHora(clase.horaInicio)}
                            </div>
                          </div>
                          <div className="clase-info-mobile">
                            <div className="clase-alumna-name">
                              {clase.profesoraId !== currentUserId && (
                                <span className="profesora-badge">
                                  {clase.profesora.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              )}
                              {clase.alumna?.nombre || 'Disponible'}
                            </div>
                            {clase.esClasePrueba && (
                              <div className="clase-prueba-label">
                                Clase de prueba
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
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón flotante mobile */}
          <button
            onClick={() => setDialogOpen(true)}
            className="fab-button-mobile"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Vista Desktop: Semana */}
        <div className="desktop-only">
          <div className="content-card">
            {/* Navegación de semana */}
            <div className="calendar-week-nav">
              <button
                onClick={irSemanaAnterior}
                className="calendar-nav-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="calendar-week-header">
                <h2 className="calendar-week-title">
                  {formatearFecha(clasesDeLaSemana[0].fecha)} - {formatearFecha(clasesDeLaSemana[6].fecha)}
                </h2>
                <button
                  onClick={irHoy}
                  className="calendar-week-today-btn"
                >
                  Hoy
                </button>
              </div>

              <button
                onClick={irSemanaSiguiente}
                className="calendar-nav-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Grid semanal */}
            <div className="calendar-week-grid-wrapper">
              <div className="calendar-week-grid-inner">
                {/* Headers de días */}
                <div className="calendar-week-header-grid">
                  <div className="calendar-week-time-header"></div>
                  {clasesDeLaSemana.map((dia, idx) => {
                    const esHoy = formatearFechaDia(dia.fecha) === formatearFechaDia(new Date())
                    return (
                      <div
                        key={idx}
                        className={`calendar-week-day-header ${esHoy ? 'today' : ''}`}
                      >
                        <div className="calendar-day-name">
                          {DIAS_SEMANA[dia.fecha.getDay()]}
                        </div>
                        <div className={`calendar-day-number ${esHoy ? 'today' : ''}`}>
                          {dia.fecha.getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Grid de horarios */}
                <div className="calendar-week-body-grid">
                  {HORAS_DIA.map(hora => (
                    <React.Fragment key={`hora-${hora}`}>
                      {/* Columna de hora */}
                      <div className="calendar-hour-label">
                        <span className="calendar-hour-text">
                          {hora.toString().padStart(2, '0')}:00
                        </span>
                      </div>

                      {/* Celdas de cada día */}
                      {clasesDeLaSemana.map((dia, idx) => {
                        const clasesEnEstaHora = dia.clases.filter(clase => {
                          const horaClase = parseInt(clase.horaInicio.split(':')[0])
                          return horaClase === hora
                        })

                        return (
                          <div
                            key={`${idx}-${hora}`}
                            className="calendar-hour-cell"
                          >
                            {clasesEnEstaHora.map(clase => (
                              <button
                                key={clase.id}
                                onClick={() => handleClaseClick(clase)}
                                className={`clase-item-week ${clase.estado}`}
                              >
                                <div className="clase-week-time">
                                  {formatearHora(clase.horaInicio)}
                                </div>
                                <div className="clase-week-alumna">
                                  {clase.alumna?.nombre || 'Disponible'}
                                </div>
                                {clase.esClasePrueba && (
                                  <div className="clase-week-prueba">
                                    Prueba
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ClaseDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        clase={null}
        fecha={fechaActual}
        alumnas={alumnas}
        horarioMananaInicio={horarioMananaInicio}
        horarioMananaFin={horarioMananaFin}
        horarioTardeInicio={horarioTardeInicio}
        horarioTardeFin={horarioTardeFin}
      />

      <ClaseDialog
        isOpen={editDialogOpen}
        onClose={handleCloseEditDialog}
        clase={claseSeleccionada}
        fecha={null}
        alumnas={alumnas}
        horarioMananaInicio={horarioMananaInicio}
        horarioMananaFin={horarioMananaFin}
        horarioTardeInicio={horarioTardeInicio}
        horarioTardeFin={horarioTardeFin}
      />

      {claseSeleccionada && (
        <ClaseDetailDialog
          isOpen={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          clase={claseSeleccionada}
          onEdit={handleEdit}
        />
      )}
    </>
  )
}