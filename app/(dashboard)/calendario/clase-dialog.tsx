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
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
]

type TipoClase = 'prueba' | 'recurrente'

type PackValidation = {
  type: 'needs_pack'
  alumnosSinPack: AlumnoSimple[]
} | {
  type: 'different_frequency'
  message: string
} | null

function getPackValidation(
  esRecurrente: boolean,
  selectedIds: string[],
  alumnos: AlumnoSimple[],
  isEditMode: boolean
): PackValidation {
  if (!esRecurrente || selectedIds.length === 0 || isEditMode) return null

  const selected = selectedIds
    .map(id => alumnos.find(a => a.id === id))
    .filter((a): a is AlumnoSimple => a !== undefined)

  const sinPack = selected.filter(a => a.clasesPorSemana === null)

  if (sinPack.length > 0) {
    return { type: 'needs_pack', alumnosSinPack: sinPack }
  }

  const frequencies = selected.map(a => a.clasesPorSemana)
  if (new Set(frequencies).size > 1) {
    return {
      type: 'different_frequency',
      message: 'Los alumnos seleccionados tienen packs con diferente frecuencia. Selecciona alumnos con el mismo pack.'
    }
  }

  return null
}

function getDerivedFrecuencia(
  clase: Clase | null,
  selectedIds: string[],
  alumnos: AlumnoSimple[]
): number | null {
  if (clase) return clase.frecuenciaSemanal

  if (selectedIds.length === 0) return null

  const selected = selectedIds
    .map(id => alumnos.find(a => a.id === id))
    .filter((a): a is AlumnoSimple => a !== undefined)

  const frequencies = selected
    .map(a => a.clasesPorSemana)
    .filter((f): f is number => f !== null)

  if (frequencies.length === 0 || frequencies.length !== selected.length) return null
  if (new Set(frequencies).size > 1) return null

  return frequencies[0]
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
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([])
  const [localAlumnos, setLocalAlumnos] = useState<AlumnoSimple[]>(alumnos)
  const [assigningPackFor, setAssigningPackFor] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [packSelections, setPackSelections] = useState<Record<string, string>>({})

  const esClasePrueba = tipoClase === 'prueba'
  const esRecurrente = tipoClase === 'recurrente'
  const isEditMode = clase !== null

  const frecuencia = useMemo(
    () => getDerivedFrecuencia(clase, alumnosSeleccionados, localAlumnos),
    [clase, alumnosSeleccionados, localAlumnos]
  )

  const packValidation = useMemo(
    () => getPackValidation(esRecurrente, alumnosSeleccionados, localAlumnos, isEditMode),
    [esRecurrente, alumnosSeleccionados, localAlumnos, isEditMode]
  )

  const hasPackError = packValidation !== null

  useEffect(() => {
    if (isOpen) {
      setLocalAlumnos(alumnos)
      setAssignError(null)
      setPackSelections({})
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
    } catch (err) {
      setAssignError(getErrorMessage(err) || 'Error al asignar pack')
    } finally {
      setAssigningPackFor(null)
    }
  }

  const handleDiaToggle = (dia: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(dia)) {
        return prev.filter(d => d !== dia)
      }
      if (frecuencia && prev.length >= frecuencia) {
        return [...prev.slice(1), dia]
      }
      return [...prev, dia]
    })
  }

  const handleAlumnoToggle = (alumnoId: string) => {
    setAlumnosSeleccionados(prev => {
      if (prev.includes(alumnoId)) return prev.filter(id => id !== alumnoId)
      if (prev.length >= maxAlumnosPorClase) return prev
      return [...prev, alumnoId]
    })
    if (!isEditMode) setDiasSeleccionados([])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (esRecurrente && !frecuencia) {
      setError('Los alumnos seleccionados necesitan un pack con frecuencia definida')
      return
    }

    if (esRecurrente && frecuencia && diasSeleccionados.length !== frecuencia) {
      setError(`Selecciona exactamente ${frecuencia} dia${frecuencia === 1 ? '' : 's'}`)
      return
    }

    if (alumnosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un alumno')
      return
    }

    if (hasPackError) return

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
          frecuenciaSemanal: frecuencia || undefined,
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
          diasSemana: esRecurrente ? diasSeleccionados : undefined,
          fecha: fechaStr
        })
        const numClases = alumnosSeleccionados.length * (esRecurrente ? 1 + diasSeleccionados.length * 8 : 1)
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
        disabled={isLoading || hasPackError}
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
          <label>
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
                    <span className="chip-remove">×</span>
                  </button>
                ) : null
              })}
            </div>
          )}

          {alumnosSeleccionados.length < maxAlumnosPorClase && (
            <SelectInput
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
          <label>Fecha</label>
          <DateInput name="fecha" required defaultValue={defaultFecha} disabled={isLoading} />
        </div>

        <div className="form-group">
          <label>Hora inicial</label>
          <TimeInput
            name="horaInicio"
            defaultValue={clase?.horaInicio || horarioMananaInicio}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Tipo de clase</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-option ${tipoClase === 'prueba' ? 'active' : ''}`}
              onClick={() => { setTipoClase('prueba'); setDiasSeleccionados([]) }}
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

        {esRecurrente && packValidation?.type === 'different_frequency' && (
          <div className="form-message error">{packValidation.message}</div>
        )}

        {esRecurrente && packValidation?.type === 'needs_pack' && (
          <div className="pack-assignment-section">
            {packValidation.alumnosSinPack.map(alumno => (
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

        {esRecurrente && frecuencia && !hasPackError && (
          <>
            <div className="form-group">
              <label>Frecuencia: {frecuencia}x por semana</label>
              {!isEditMode && (
                <small style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                  Definida por el pack del alumno
                </small>
              )}
            </div>

            <div className="form-group">
              <label>
                Que dia{frecuencia > 1 ? 's' : ''}?
                <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '0.5rem' }}>
                  ({diasSeleccionados.length}/{frecuencia} seleccionado{frecuencia > 1 ? 's' : ''})
                </span>
              </label>
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
              <label>Hora de las clases recurrentes</label>
              <TimeInput
                name="horaRecurrente"
                defaultValue={clase?.horaRecurrente || horarioMananaInicio}
                disabled={isLoading}
                required={false}
              />
              <small style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', display: 'block' }}>
                Deja vacio para usar la misma hora que la clase inicial
              </small>
            </div>

            {!clase && diasSeleccionados.length === frecuencia && (
              <div className="form-hint-info">
                Se crearan {diasSeleccionados.length} clases por semana durante las proximas 8 semanas (total: {diasSeleccionados.length * 8} clases recurrentes + 1 clase inicial)
              </div>
            )}
          </>
        )}
      </form>
    </DialogBase>
  )
}
