'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Trash2, Sun, Moon, Sunset, Pencil, X, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaseDialog } from './clase-dialog'
import { ClaseDetailDialog } from './clase-detail-dialog'
import { SerieEditDialog } from './serie-edit-dialog'
import { deleteClaseAPI, changeClaseStatusAPI, bulkDeleteClasesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import type { Clase, AlumnoSimple, Pack, CalendarioFeatures } from '@/lib/types'
import { DIAS_SEMANA, DIAS_SEMANA_COMPLETO, MESES } from '@/lib/constants'
import { getTurno, formatearHora, formatearFechaDia, getErrorMessage } from '@/lib/utils'

interface CalendarioClientProps {
  clasesIniciales: Clase[]
  alumnos: AlumnoSimple[]
  packs: Pack[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  maxAlumnosPorClase: number
  horasAnticipacionMinima: number
  features: CalendarioFeatures
}

const HORAS_DIA = Array.from({ length: 16 }, (_, i) => i + 7) // 7:00 a 22:00

export function CalendarioClient({ clasesIniciales, alumnos, packs, horarioMananaInicio, horarioMananaFin, horarioTardeInicio, horarioTardeFin, maxAlumnosPorClase, horasAnticipacionMinima, features }: CalendarioClientProps) {
  const { showSuccess, showError } = useToast()
  const [clases, setClases] = useState<Clase[]>(clasesIniciales)
  const [fechaActual, setFechaActual] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [serieEditOpen, setSerieEditOpen] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null)
  const [selectedClases, setSelectedClases] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [turnosExpandidos, setTurnosExpandidos] = useState<Set<string>>(new Set())

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
      const clasesDelDia = clases.filter(clase => formatearFechaDia(clase.fecha) === fechaStr)
      return {
        fecha,
        clases: clasesDelDia
      }
    })
  }, [clases, fechaActual])

  // Agrupar clases por turno y luego por hora
  const clasesPorTurno = useMemo(() => {
    type ClasesPorHora = { hora: string; clases: Clase[] }
    const grupos: { mañana: ClasesPorHora[]; tarde: ClasesPorHora[]; noche: ClasesPorHora[] } = {
      mañana: [],
      tarde: [],
      noche: []
    }

    // Primero agrupamos por turno
    const turnoClases: { mañana: Clase[]; tarde: Clase[]; noche: Clase[] } = {
      mañana: [],
      tarde: [],
      noche: []
    }

    clasesDelDia.forEach(clase => {
      const hora = parseInt(clase.horaInicio.split(':')[0])
      const turno = getTurno(hora, horarioTardeInicio)
      turnoClases[turno].push(clase)
    })

    // Ahora agrupamos por hora dentro de cada turno
    Object.entries(turnoClases).forEach(([turno, clases]) => {
      const porHora = new Map<string, Clase[]>()
      clases.forEach(clase => {
        const existing = porHora.get(clase.horaInicio) || []
        existing.push(clase)
        porHora.set(clase.horaInicio, existing)
      })

      // Convertir a array ordenado por hora
      const horasOrdenadas = Array.from(porHora.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hora, clases]) => ({ hora, clases }))

      grupos[turno as keyof typeof grupos] = horasOrdenadas
    })

    return grupos
  }, [clasesDelDia, horarioTardeInicio])

  // Helper para obtener resumen de alumnos en un turno (para vista previa)
  const obtenerResumenTurno = (turno: { hora: string; clases: Clase[] }[]) => {
    const nombres = turno.flatMap(({ clases }) =>
      clases.map(c => c.alumno?.nombre?.split(' ')[0] || 'Sin alumno')
    )
    return nombres
  }

  // Helper para contar total de clases en un turno
  const contarClasesTurno = (turno: { hora: string; clases: Clase[] }[]) =>
    turno.reduce((acc, h) => acc + h.clases.length, 0)

  // Toggle turno expandido/colapsado
  const toggleTurno = (turno: string) => {
    setTurnosExpandidos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(turno)) {
        newSet.delete(turno)
      } else {
        newSet.add(turno)
      }
      return newSet
    })
  }

  const handleClaseClick = (clase: Clase, e?: React.MouseEvent) => {
    // Ctrl+Click o Cmd+Click para seleccionar
    if (e && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      toggleSelection(clase.id)
      return
    }
    setClaseSeleccionada(clase)
    setDetailDialogOpen(true)
  }

  const handleEdit = () => {
    setDetailDialogOpen(false)
    setEditDialogOpen(true)
  }

  const handleEditSeries = () => {
    setDetailDialogOpen(false)
    setSerieEditOpen(true)
  }

  const handleSerieEditSuccess = () => {
    setSerieEditOpen(false)
    setClaseSeleccionada(null)
    window.location.reload()
  }

  // Handler para actualizar estado local cuando se crea/edita una clase
  const handleClaseSuccess = (data: { clase?: Clase; clases?: Clase[]; isNew: boolean }) => {
    if (data.clases && data.clases.length > 0) {
      // Múltiples clases creadas
      const clasesConFecha = data.clases.map(c => ({
        ...c,
        fecha: new Date(c.fecha)
      }))
      setClases(prev => [...prev, ...clasesConFecha])
    } else if (data.clase) {
      // Una sola clase creada o actualizada
      const claseConFecha = {
        ...data.clase,
        fecha: new Date(data.clase.fecha)
      }

      if (data.isNew) {
        setClases(prev => [...prev, claseConFecha])
      } else {
        setClases(prev => prev.map(c => c.id === claseConFecha.id ? claseConFecha : c))
      }
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setDetailDialogOpen(false)
    setClaseSeleccionada(null)
  }

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false)
    setClaseSeleccionada(null)
  }

  const toggleSelection = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    e?.stopPropagation()
    const newSelection = new Set(selectedClases)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedClases(newSelection)
  }

  const handleBulkDelete = async () => {
    if (selectedClases.size === 0) return
    setIsDeleting(true)

    try {
      await bulkDeleteClasesAPI(Array.from(selectedClases))
      // Actualización local
      setClases(prev => prev.filter(c => !selectedClases.has(c.id)))
      setSelectedClases(new Set())
      setBulkDeleteConfirm(false)
      showSuccess(`${selectedClases.size} clase(s) eliminada(s)`)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  // Handler para eliminar una clase individual
  const handleDeleteClase = async (id: string) => {
    try {
      await deleteClaseAPI(id)
      setClases(prev => prev.filter(c => c.id !== id))
      showSuccess('Clase eliminada')
    } catch (err) {
      showError(getErrorMessage(err))
      throw err
    }
  }

  // Handler para cambiar estado de una clase
  const handleStatusChange = async (id: string, estado: string) => {
    // Guardar estado anterior para revertir si hay error
    const estadoAnterior = clases.find(c => c.id === id)?.estado
    // Actualización optimista
    setClases(prev => prev.map(c => c.id === id ? { ...c, estado } : c))
    try {
      await changeClaseStatusAPI(id, estado)
      showSuccess('Estado actualizado')
    } catch (err) {
      // Revertir al estado anterior
      if (estadoAnterior) {
        setClases(prev => prev.map(c => c.id === id ? { ...c, estado: estadoAnterior } : c))
      }
      showError(getErrorMessage(err))
      throw err
    }
  }

  const formatearFecha = (fecha: Date) => {
    const dia = DIAS_SEMANA_COMPLETO[fecha.getDay()]
    const num = fecha.getDate()
    const mes = MESES[fecha.getMonth()].substring(0, 3)
    return `${dia}, ${num} ${mes}`
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
          <div className="page-header-actions desktop-only">
            {clases.length > 0 && (
              <Button
                className={`btn-outline ${selectionMode ? 'active' : ''}`}
                onClick={() => {
                  setSelectionMode(!selectionMode)
                  if (selectionMode) setSelectedClases(new Set())
                }}
              >
                <CheckSquare className="w-4 h-4" />
                {selectionMode ? 'Cancelar' : 'Seleccionar'}
              </Button>
            )}
            <Button
              className="btn-primary"
              onClick={() => setDialogOpen(true)}
              disabled={alumnos.length === 0}
              title={alumnos.length === 0 ? 'Primero debes agregar alumnos' : ''}
            >
              <Plus className="w-4 h-4" />
              Nueva Clase
            </Button>
          </div>
        </div>

        {/* Vista Mobile: Lista Diaria */}
        <div className="mobile-only">
          <div className="content-card">
            {/* Navegación de fecha */}
            <div className="calendar-mobile-nav">
              <button
                onClick={irDiaAnterior}
                className="calendar-nav-btn"
                aria-label="Día anterior"
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
                aria-label="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Botón seleccionar mobile */}
            {clasesDelDia.length > 0 && (
              <div className="mobile-selection-bar">
                <button
                  className={`mobile-selection-btn ${selectionMode ? 'active' : ''}`}
                  onClick={() => {
                    setSelectionMode(!selectionMode)
                    if (selectionMode) setSelectedClases(new Set())
                  }}
                >
                  <CheckSquare size={16} />
                  {selectionMode ? 'Cancelar' : 'Seleccionar'}
                </button>
              </div>
            )}

            {/* Clases del día */}
            {clasesDelDia.length === 0 ? (
              <div className="empty-state-small">
                <CalendarIcon className="w-12 h-12" />
                <p>No hay clases programadas</p>
                <p className="text-sm text-white/40 mt-1">para este día</p>
              </div>
            ) : (
              <div className={`calendar-turnos-container ${selectionMode ? 'selection-mode' : ''}`}>
                {/* Mañana */}
                {clasesPorTurno.mañana.length > 0 && (
                  <div className={`turno-accordion ${turnosExpandidos.has('mañana') ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="turno-accordion-header"
                      onClick={() => toggleTurno('mañana')}
                    >
                      <div className="turno-accordion-left">
                        <div className="turno-accordion-info">
                          <Sun size={14} className="turno-icon-sun" />
                          <span className="turno-accordion-label">Mañana</span>
                          <span className="turno-accordion-count">{contarClasesTurno(clasesPorTurno.mañana)}</span>
                        </div>
                        {!turnosExpandidos.has('mañana') && (
                          <div className="turno-preview">
                            {obtenerResumenTurno(clasesPorTurno.mañana).slice(0, 3).join(', ')}
                            {obtenerResumenTurno(clasesPorTurno.mañana).length > 3 && ` +${obtenerResumenTurno(clasesPorTurno.mañana).length - 3}`}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`turno-accordion-icon ${turnosExpandidos.has('mañana') ? 'expanded' : ''}`} />
                    </button>
                    {turnosExpandidos.has('mañana') && (
                      <div className="turno-accordion-content">
                        {clasesPorTurno.mañana.map(({ hora, clases: clasesHora }) => (
                          <div key={hora} className="horario-group-compact">
                            <span className="hora-compact">{formatearHora(hora)}</span>
                            <div className="clases-list-compact">
                              {clasesHora.map(clase => (
                                <button
                                  key={clase.id}
                                  onClick={() => handleClaseClick(clase)}
                                  className={`clase-item-compact ${clase.estado} ${selectedClases.has(clase.id) ? 'selected' : ''}`}
                                >
                                  {selectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedClases.has(clase.id)}
                                      onChange={(e) => toggleSelection(clase.id, e)}
                                      className="compact-checkbox"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <span className="nombre-compact">{clase.alumno?.nombre || 'Disponible'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tarde */}
                {clasesPorTurno.tarde.length > 0 && (
                  <div className={`turno-accordion ${turnosExpandidos.has('tarde') ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="turno-accordion-header"
                      onClick={() => toggleTurno('tarde')}
                    >
                      <div className="turno-accordion-left">
                        <div className="turno-accordion-info">
                          <Sunset size={14} className="turno-icon-sunset" />
                          <span className="turno-accordion-label">Tarde</span>
                          <span className="turno-accordion-count">{contarClasesTurno(clasesPorTurno.tarde)}</span>
                        </div>
                        {!turnosExpandidos.has('tarde') && (
                          <div className="turno-preview">
                            {obtenerResumenTurno(clasesPorTurno.tarde).slice(0, 3).join(', ')}
                            {obtenerResumenTurno(clasesPorTurno.tarde).length > 3 && ` +${obtenerResumenTurno(clasesPorTurno.tarde).length - 3}`}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`turno-accordion-icon ${turnosExpandidos.has('tarde') ? 'expanded' : ''}`} />
                    </button>
                    {turnosExpandidos.has('tarde') && (
                      <div className="turno-accordion-content">
                        {clasesPorTurno.tarde.map(({ hora, clases: clasesHora }) => (
                          <div key={hora} className="horario-group-compact">
                            <span className="hora-compact">{formatearHora(hora)}</span>
                            <div className="clases-list-compact">
                              {clasesHora.map(clase => (
                                <button
                                  key={clase.id}
                                  onClick={() => handleClaseClick(clase)}
                                  className={`clase-item-compact ${clase.estado} ${selectedClases.has(clase.id) ? 'selected' : ''}`}
                                >
                                  {selectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedClases.has(clase.id)}
                                      onChange={(e) => toggleSelection(clase.id, e)}
                                      className="compact-checkbox"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <span className="nombre-compact">{clase.alumno?.nombre || 'Disponible'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Noche */}
                {clasesPorTurno.noche.length > 0 && (
                  <div className={`turno-accordion ${turnosExpandidos.has('noche') ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="turno-accordion-header"
                      onClick={() => toggleTurno('noche')}
                    >
                      <div className="turno-accordion-left">
                        <div className="turno-accordion-info">
                          <Moon size={14} className="turno-icon-moon" />
                          <span className="turno-accordion-label">Noche</span>
                          <span className="turno-accordion-count">{contarClasesTurno(clasesPorTurno.noche)}</span>
                        </div>
                        {!turnosExpandidos.has('noche') && (
                          <div className="turno-preview">
                            {obtenerResumenTurno(clasesPorTurno.noche).slice(0, 3).join(', ')}
                            {obtenerResumenTurno(clasesPorTurno.noche).length > 3 && ` +${obtenerResumenTurno(clasesPorTurno.noche).length - 3}`}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`turno-accordion-icon ${turnosExpandidos.has('noche') ? 'expanded' : ''}`} />
                    </button>
                    {turnosExpandidos.has('noche') && (
                      <div className="turno-accordion-content">
                        {clasesPorTurno.noche.map(({ hora, clases: clasesHora }) => (
                          <div key={hora} className="horario-group-compact">
                            <span className="hora-compact">{formatearHora(hora)}</span>
                            <div className="clases-list-compact">
                              {clasesHora.map(clase => (
                                <button
                                  key={clase.id}
                                  onClick={() => handleClaseClick(clase)}
                                  className={`clase-item-compact ${clase.estado} ${selectedClases.has(clase.id) ? 'selected' : ''}`}
                                >
                                  {selectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedClases.has(clase.id)}
                                      onChange={(e) => toggleSelection(clase.id, e)}
                                      className="compact-checkbox"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <span className="nombre-compact">{clase.alumno?.nombre || 'Disponible'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón flotante mobile */}
          {alumnos.length > 0 && (
            <button
              onClick={() => setDialogOpen(true)}
              className="fab-button-mobile"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Vista Desktop: Semana */}
        <div className="desktop-only">
          <div className="content-card">
            {/* Navegación de semana */}
            <div className="calendar-week-nav">
              <button
                onClick={irSemanaAnterior}
                className="calendar-nav-btn"
                aria-label="Semana anterior"
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
                aria-label="Semana siguiente"
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
                <div className={`calendar-week-body-grid ${selectionMode ? 'selection-mode' : ''}`}>
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
                            {clasesEnEstaHora.length > 0 && (() => {
                              const todasCanceladas = clasesEnEstaHora.every(c => c.estado === 'cancelada' || !c.alumno)

                              return (
                                <div className="clase-group-week">
                                  {todasCanceladas ? (
                                    <span className="clase-badge vacia">Sin clase</span>
                                  ) : (
                                    <div className="clase-badges">
                                      {clasesEnEstaHora.map((clase) => (
                                        <label
                                          key={clase.id}
                                          className={`clase-badge ${clase.estado} ${selectedClases.has(clase.id) ? 'selected' : ''}`}
                                          onClick={(e) => {
                                            if (!selectionMode) {
                                              e.preventDefault()
                                              setClaseSeleccionada(clase)
                                              setDetailDialogOpen(true)
                                            }
                                          }}
                                          title={clase.alumno?.nombre || 'Disponible'}
                                        >
                                          {selectionMode && (
                                            <input
                                              type="checkbox"
                                              checked={selectedClases.has(clase.id)}
                                              onChange={() => toggleSelection(clase.id)}
                                              className="badge-checkbox"
                                            />
                                          )}
                                          {clase.alumno?.nombre?.split(' ')[0] || 'Disp.'}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
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
        alumnos={alumnos}
        packs={packs}
        horarioMananaInicio={horarioMananaInicio}
        maxAlumnosPorClase={maxAlumnosPorClase}
        onSuccess={handleClaseSuccess}
        canUseRecurrentes={features.clasesRecurrentes}
      />

      <ClaseDialog
        isOpen={editDialogOpen}
        onClose={handleCloseEditDialog}
        clase={claseSeleccionada}
        fecha={null}
        alumnos={alumnos}
        packs={packs}
        horarioMananaInicio={horarioMananaInicio}
        maxAlumnosPorClase={maxAlumnosPorClase}
        onSuccess={handleClaseSuccess}
        canUseRecurrentes={features.clasesRecurrentes}
      />

      {claseSeleccionada && (
        <ClaseDetailDialog
          isOpen={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          clase={claseSeleccionada}
          onEdit={handleEdit}
          onEditSeries={handleEditSeries}
          onDelete={handleDeleteClase}
          onStatusChange={handleStatusChange}
          horasAnticipacionMinima={horasAnticipacionMinima}
        />
      )}

      <SerieEditDialog
        isOpen={serieEditOpen}
        onClose={() => { setSerieEditOpen(false); setClaseSeleccionada(null) }}
        clase={claseSeleccionada}
        onSuccess={handleSerieEditSuccess}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`¿Eliminar ${selectedClases.size} clase(s)?`}
        description="Esta acción no se puede deshacer. Se eliminarán todas las clases seleccionadas."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Floating action bar - solo cuando hay seleccionadas */}
      {selectionMode && selectedClases.size > 0 && (
        <div className="floating-action-bar">
          <div className="floating-action-bar-content">
            <button className="fab-close" onClick={() => {
              setSelectedClases(new Set())
              setSelectionMode(false)
            }}>
              <X size={18} />
            </button>
            <span className="fab-count">{selectedClases.size} seleccionada{selectedClases.size > 1 ? 's' : ''}</span>

            <div className="fab-actions">
              {selectedClases.size === 1 && (
                <button
                  className="fab-btn"
                  onClick={() => {
                    const claseId = Array.from(selectedClases)[0]
                    const clase = clases.find(c => c.id === claseId)
                    if (clase) {
                      setClaseSeleccionada(clase)
                      setDetailDialogOpen(true)
                      setSelectedClases(new Set())
                      setSelectionMode(false)
                    }
                  }}
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
              )}
              <button className="fab-btn danger" onClick={() => setBulkDeleteConfirm(true)} title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}