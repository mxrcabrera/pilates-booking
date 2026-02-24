'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClaseAPI, updateClaseAPI, assignPackToAlumnoAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import { DialogBase } from '@/components/ui/dialog-base'
import { TimeInput } from '@/components/time-input'
import { DateInput } from '@/components/date-input'
import { SelectInput } from '@/components/select-input'
import type { Clase, AlumnoSimple, Pack } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miercoles', short: 'Mie' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sabado', short: 'Sab' },
  { value: 0, label: 'Domingo', short: 'Dom' },
]

type TipoClase = 'prueba' | 'recurrente'

function getAlumnosSinPack(
  selectedIds: string[],
  alumnos: AlumnoSimple[]
): AlumnoSimple[] {
  return selectedIds
    .map(id => alumnos.find(a => a.id === id))
    .filter((a): a is AlumnoSimple => a !== undefined && a.clasesPorSemana === null)
}

function getAlumnosConPack(
  selectedIds: string[],
  alumnos: AlumnoSimple[]
): AlumnoSimple[] {
  return selectedIds
    .map(id => alumnos.find(a => a.id === id))
    .filter((a): a is AlumnoSimple => a !== undefined && a.clasesPorSemana !== null)
}

export function ClaseDialog({
  isOpen,
  onClose,
  clase,
  fecha,
  alumnos,
  packs,
  horarioMananaInicio,
  horarioMananaFin: _horarioMananaFin,
  horarioTardeInicio: _horarioTardeInicio,
  horarioTardeFin: _horarioTardeFin,
  maxAlumnosPorClase,
  onSuccess,
  canUseRecurrentes = true,
  currentPlan: _currentPlan = 'STARTER'
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  fecha: Date | null
  alumnos: AlumnoSimple[]
  packs: Pack[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  maxAlumnosPorClase: number
  onSuccess?: (data: { clase?: Clase; clases?: Clase[]; isNew: boolean }) => void
  canUseRecurrentes?: boolean
  currentPlan?: string
}) {
  const { showSuccess } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoClase, setTipoClase] = useState<TipoClase>('recurrente')
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([])
  const [localAlumnos, setLocalAlumnos] = useState<AlumnoSimple[]>(alumnos)
  const [assigningPackFor, setAssigningPackFor] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [packSelections, setPackSelections] = useState<Record<string, string>>({})

  // Per-student day selections (only for create mode)
  const [diasPorAlumno, setDiasPorAlumno] = useState<Record<string, number[]>>({})

  // Edit mode: single student day selector
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])

  const esClasePrueba = tipoClase === 'prueba'
  const esRecurrente = tipoClase === 'recurrente'
  const isEditMode = clase !== null

  const alumnosSinPack = useMemo(
    () => esRecurrente && !isEditMode ? getAlumnosSinPack(alumnosSeleccionados, localAlumnos) : [],
    [esRecurrente, isEditMode, alumnosSeleccionados, localAlumnos]
  )

  const alumnosConPack = useMemo(
    () => esRecurrente && !isEditMode ? getAlumnosConPack(alumnosSeleccionados, localAlumnos) : [],
    [esRecurrente, isEditMode, alumnosSeleccionados, localAlumnos]
  )

  const hasPackError = alumnosSinPack.length > 0

  // Get the weekday of the clicked date for pre-selection
  const clickedDayOfWeek = fecha ? fecha.getDay() : null

  // Edit mode: derive frequency from the class data
  const editFrecuencia = clase?.frecuenciaSemanal ?? (clase?.diasSemana?.length || null)

  useEffect(() => {
    if (isOpen) {
      setLocalAlumnos(alumnos)
      setAssignError(null)
      setPackSelections({})
      setDiasPorAlumno({})
      if (clase) {
        const tipoActual = clase.esClasePrueba ? 'prueba' : 'recurrente'
        setTipoClase(tipoActual === 'recurrente' && !canUseRecurrentes ? 'prueba' : tipoActual)
        setDiasSeleccionados(clase.diasSemana || [])
        setAlumnosSeleccionados(clase.alumno?.id ? [clase.alumno.id] : [])
      } else {
        setTipoClase(canUseRecurrentes ? 'recurrente' : 'prueba')
        setDiasSeleccionados([])
        setAlumnosSeleccionados([])
      }
      setError(null)
    }
  }, [isOpen, clase, canUseRecurrentes, alumnos])

  async function handleAssignPack(alumnoId: string) {
    const packId = packSelections[alumnoId]
    if (!packId) return

    const pack = packs.find(p => p.id === packId)
    if (!pack) return

    setAssigningPackFor(alumnoId)
    setAssignError(null)
    try {
      await assignPackToAlumnoAPI({
        id: alumnoId,
        packType: packId,
        precio: Number(pack.precio)
      })
      setLocalAlumnos(prev => prev.map(a =>
        a.id === alumnoId
          ? { ...a, packType: packId, clasesPorSemana: pack.clasesPorSemana }
          : a
      ))
      setPackSelections(prev => {
        const next = { ...prev }
        delete next[alumnoId]
        return next
      })
      // Pre-select clicked day for newly assigned pack student
      if (clickedDayOfWeek !== null) {
        setDiasPorAlumno(prev => ({
          ...prev,
          [alumnoId]: [clickedDayOfWeek]
        }))
      }
    } catch (err) {
      setAssignError(getErrorMessage(err) || 'Error al asignar pack')
    } finally {
      setAssigningPackFor(null)
    }
  }

  const handleDiaToggleForAlumno = (alumnoId: string, dia: number) => {
    const alumno = localAlumnos.find(a => a.id === alumnoId)
    const maxDias = alumno?.clasesPorSemana || 1

    setDiasPorAlumno(prev => {
      const current = prev[alumnoId] || []
      if (current.includes(dia)) {
        return { ...prev, [alumnoId]: current.filter(d => d !== dia) }
      }
      if (current.length >= maxDias) {
        return { ...prev, [alumnoId]: [...current.slice(1), dia] }
      }
      return { ...prev, [alumnoId]: [...current, dia] }
    })
  }

  // Edit mode: single student day toggle
  const handleDiaToggle = (dia: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(dia)) {
        return prev.filter(d => d !== dia)
      }
      if (editFrecuencia && prev.length >= editFrecuencia) {
        return [...prev.slice(1), dia]
      }
      return [...prev, dia]
    })
  }

  const handleAlumnoToggle = (alumnoId: string) => {
    setAlumnosSeleccionados(prev => {
      if (prev.includes(alumnoId)) {
        // Remove student -> clean up their dias
        setDiasPorAlumno(prevDias => {
          const next = { ...prevDias }
          delete next[alumnoId]
          return next
        })
        return prev.filter(id => id !== alumnoId)
      }
      if (prev.length >= maxAlumnosPorClase) return prev

      // Pre-select clicked day for new student
      if (!isEditMode && clickedDayOfWeek !== null) {
        setDiasPorAlumno(prevDias => ({
          ...prevDias,
          [alumnoId]: [clickedDayOfWeek]
        }))
      }
      return [...prev, alumnoId]
    })
  }

  // Calculate total classes for summary
  const totalClassesSummary = useMemo(() => {
    if (!esRecurrente || isEditMode) return null
    let total = 0
    for (const alumno of alumnosConPack) {
      const dias = diasPorAlumno[alumno.id] || []
      total += dias.length > 0 ? 1 + dias.length * 8 : 1
    }
    return total
  }, [esRecurrente, isEditMode, alumnosConPack, diasPorAlumno])

  // Check if all students have their dias complete
  const allDiasComplete = useMemo(() => {
    if (!esRecurrente || isEditMode) return true
    return alumnosConPack.every(a => {
      const dias = diasPorAlumno[a.id] || []
      return dias.length === (a.clasesPorSemana || 0)
    })
  }, [esRecurrente, isEditMode, alumnosConPack, diasPorAlumno])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (hasPackError) return

    if (esRecurrente && !isEditMode && !allDiasComplete) {
      setError('Selecciona los dias de clase para todos los alumnos')
      return
    }

    if (isEditMode && esRecurrente && editFrecuencia && diasSeleccionados.length !== editFrecuencia) {
      setError(`Selecciona exactamente ${editFrecuencia} dia${editFrecuencia === 1 ? '' : 's'}`)
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const horaInicio = formData.get('horaInicio') as string
    const horaRecurrente = formData.get('horaRecurrente') as string
    const fechaStr = formData.get('fecha') as string

    try {
      if (clase) {
        const result = await updateClaseAPI({
          id: clase.id,
          alumnoId: alumnosSeleccionados[0] || undefined,
          horaInicio,
          horaRecurrente: horaRecurrente || undefined,
          estado: clase.estado,
          esClasePrueba,
          esRecurrente,
          diasSemana: esRecurrente ? diasSeleccionados : undefined,
          fecha: fechaStr
        })
        showSuccess('Clase actualizada')
        onSuccess?.({ clase: result.clase, isNew: false })
      } else {
        const result = await createClaseAPI({
          alumnoIds: alumnosSeleccionados,
          horaInicio,
          horaRecurrente: horaRecurrente || undefined,
          esClasePrueba,
          esRecurrente,
          alumnosDias: esRecurrente ? diasPorAlumno : undefined,
          fecha: fechaStr
        })
        const numClases = totalClassesSummary || alumnosSeleccionados.length
        showSuccess(numClases > 1 ? `${numClases} clases creadas` : 'Clase creada')
        onSuccess?.({ clases: result.clases, isNew: true })
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err) || 'Error al guardar clase')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultFecha = clase
    ? format(clase.fecha, 'yyyy-MM-dd')
    : fecha ? format(fecha, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  const footerButtons = (
    <>
      <button type="button" onClick={onClose} className="btn-ghost" disabled={isLoading}>
        Cancelar clase
      </button>
      <button
        type="submit"
        form="clase-form"
        className="btn-primary"
        disabled={isLoading || hasPackError || (esRecurrente && !isEditMode && !allDiasComplete)}
      >
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={clase ? 'Editar Clase' : 'Nueva Clase'}
      footer={footerButtons}
    >
      {error && (
        <div className="form-message error">{error}</div>
      )}

      <form id="clase-form" onSubmit={handleSubmit}>
        <input type="hidden" name="esRecurrente" value={esRecurrente ? 'true' : 'false'} />

        <div className="form-group">
          <label htmlFor="clase-alumno-select">
            Alumnos
            <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '0.5rem' }}>
              ({alumnosSeleccionados.length}/{maxAlumnosPorClase})
            </span>
          </label>

          {alumnosSeleccionados.length > 0 && (
            <div className="alumno-chips">
              {alumnosSeleccionados.map(id => {
                const alumno = localAlumnos.find(a => a.id === id)
                return alumno ? (
                  <button
                    key={id}
                    type="button"
                    className="alumno-chip"
                    onClick={() => handleAlumnoToggle(id)}
                    disabled={isLoading}
                  >
                    {alumno.nombre}
                    <span className="chip-remove">&times;</span>
                  </button>
                ) : null
              })}
            </div>
          )}

          {alumnosSeleccionados.length < maxAlumnosPorClase && (
            <SelectInput
              id="clase-alumno-select"
              value=""
              onChange={(e) => { if (e.target.value) handleAlumnoToggle(e.target.value) }}
              disabled={isLoading}
            >
              <option value="">Agregar alumno...</option>
              {localAlumnos
                .filter(a => !alumnosSeleccionados.includes(a.id))
                .map(alumno => (
                  <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                ))}
            </SelectInput>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="clase-fecha">Fecha</label>
          <DateInput id="clase-fecha" name="fecha" required defaultValue={defaultFecha} disabled={isLoading} />
        </div>

        <div className="form-group">
          <label htmlFor="clase-hora-inicio">Hora inicial</label>
          <TimeInput
            id="clase-hora-inicio"
            name="horaInicio"
            defaultValue={clase?.horaInicio || horarioMananaInicio}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <span className="form-label">Tipo de clase</span>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-option ${tipoClase === 'prueba' ? 'active' : ''}`}
              onClick={() => { setTipoClase('prueba'); setDiasSeleccionados([]); setDiasPorAlumno({}) }}
              disabled={isLoading}
            >
              Prueba
            </button>
            <button
              type="button"
              className={`segmented-option ${tipoClase === 'recurrente' ? 'active' : ''} ${!canUseRecurrentes ? 'locked' : ''}`}
              onClick={() => canUseRecurrentes && setTipoClase('recurrente')}
              disabled={isLoading || !canUseRecurrentes}
              title={!canUseRecurrentes ? `Disponible en plan ${PLAN_NAMES['STARTER']}` : undefined}
            >
              {!canUseRecurrentes && <Lock size={14} className="lock-icon" />}
              Recurrente
            </button>
          </div>
          {!canUseRecurrentes && (
            <p className="feature-locked-hint">
              Las clases recurrentes están disponibles desde el plan {PLAN_NAMES['STARTER']}
            </p>
          )}
        </div>

        {/* Pack assignment for students without pack */}
        {esRecurrente && !isEditMode && alumnosSinPack.length > 0 && (
          <div className="pack-assignment-section">
            {alumnosSinPack.map(alumno => (
              <div key={alumno.id} className="pack-assignment-row">
                <span className="pack-assignment-name">{alumno.nombre} no tiene pack</span>
                <div className="pack-assignment-controls">
                  <SelectInput
                    value={packSelections[alumno.id] || ''}
                    onChange={(e) => setPackSelections(prev => ({ ...prev, [alumno.id]: e.target.value }))}
                    disabled={assigningPackFor === alumno.id}
                  >
                    <option value="">Seleccionar pack...</option>
                    {packs.map(pack => (
                      <option key={pack.id} value={pack.id}>
                        {pack.nombre} ({pack.clasesPorSemana}x/sem - ${pack.precio})
                      </option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => handleAssignPack(alumno.id)}
                    disabled={!packSelections[alumno.id] || assigningPackFor === alumno.id}
                  >
                    {assigningPackFor === alumno.id ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            ))}
            {assignError && (
              <div className="form-message error" style={{ marginTop: '0.5rem' }}>{assignError}</div>
            )}
          </div>
        )}

        {/* Per-student day selection cards (create mode only) */}
        {esRecurrente && !isEditMode && alumnosConPack.length > 0 && (
          <div className="student-days-section">
            <span className="form-label section-label">Dias de clase por alumno</span>
            {alumnosConPack.map(alumno => {
              const freq = alumno.clasesPorSemana || 0
              const selectedDias = diasPorAlumno[alumno.id] || []
              return (
                <div key={alumno.id} className="student-day-card">
                  <div className="student-day-header">
                    <span className="student-day-name">{alumno.nombre}</span>
                    <span className="student-day-freq">
                      {selectedDias.length}/{freq}x/sem
                    </span>
                  </div>
                  <div className="dias-grid compact">
                    {DIAS_SEMANA.map((dia) => (
                      <label key={dia.value} className="dia-option" htmlFor={`dia-${alumno.id}-${dia.value}`}>
                        <input
                          type="checkbox"
                          id={`dia-${alumno.id}-${dia.value}`}
                          checked={selectedDias.includes(dia.value)}
                          onChange={() => handleDiaToggleForAlumno(alumno.id, dia.value)}
                          disabled={isLoading}
                        />
                        <span>{dia.short}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Summary */}
            {allDiasComplete && totalClassesSummary !== null && totalClassesSummary > 0 && (
              <div className="form-hint-info">
                Se crearan {totalClassesSummary} clases en total (incluye 8 semanas de recurrencia por alumno)
              </div>
            )}
          </div>
        )}

        {/* Edit mode: single student day selector */}
        {esRecurrente && isEditMode && editFrecuencia && (
          <>
            <div className="form-group">
              <span className="form-label">Frecuencia: {editFrecuencia}x por semana</span>
            </div>

            <div className="form-group">
              <span className="form-label">
                Que dia{editFrecuencia > 1 ? 's' : ''}?
                <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '0.5rem' }}>
                  ({diasSeleccionados.length}/{editFrecuencia} seleccionado{editFrecuencia > 1 ? 's' : ''})
                </span>
              </span>
              <div className="dias-grid">
                {DIAS_SEMANA.map((dia) => (
                  <label key={dia.value} className="dia-option" htmlFor={`dia-${dia.value}`}>
                    <input
                      type="checkbox"
                      id={`dia-${dia.value}`}
                      checked={diasSeleccionados.includes(dia.value)}
                      onChange={() => handleDiaToggle(dia.value)}
                      disabled={isLoading}
                    />
                    <span>{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="clase-hora-recurrente-edit">Hora de las clases recurrentes</label>
              <TimeInput
                id="clase-hora-recurrente-edit"
                name="horaRecurrente"
                defaultValue={clase?.horaRecurrente || horarioMananaInicio}
                disabled={isLoading}
                required={false}
              />
              <small style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', display: 'block' }}>
                Deja vacio para usar la misma hora que la clase inicial
              </small>
            </div>
          </>
        )}

        {/* Create mode: hora recurrente */}
        {esRecurrente && !isEditMode && alumnosConPack.length > 0 && (
          <div className="form-group">
            <label htmlFor="clase-hora-recurrente-create">Hora de las clases recurrentes</label>
            <TimeInput
              id="clase-hora-recurrente-create"
              name="horaRecurrente"
              defaultValue={horarioMananaInicio}
              disabled={isLoading}
              required={false}
            />
            <small style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', display: 'block' }}>
              Deja vacio para usar la misma hora que la clase inicial
            </small>
          </div>
        )}
      </form>
    </DialogBase>
  )
}
