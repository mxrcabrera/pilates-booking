'use client'

import { useState, useEffect } from 'react'
import { createClaseAPI, updateClaseAPI } from '@/lib/api'
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
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

type TipoClase = 'prueba' | 'recurrente'

export function ClaseDialog({
  isOpen,
  onClose,
  clase,
  fecha,
  alumnos,
  packs,
  precioPorClase,
  horarioMananaInicio,
  horarioMananaFin: _horarioMananaFin,
  horarioTardeInicio: _horarioTardeInicio,
  horarioTardeFin: _horarioTardeFin,
  maxAlumnosPorClase,
  onSuccess,
  canUseRecurrentes = true,
  currentPlan = 'STARTER'
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  fecha: Date | null
  alumnos: AlumnoSimple[]
  packs: Pack[]
  precioPorClase: string
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
  const [frecuencia, setFrecuencia] = useState<number | null>(null)
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([])

  const esClasePrueba = tipoClase === 'prueba'
  const esRecurrente = tipoClase === 'recurrente'

  useEffect(() => {
    if (isOpen) {
      if (clase) {
        // Si es edición de una clase existente, usar su tipo
        // Pero si no tiene permisos de recurrente, forzar a prueba
        const tipoActual = clase.esClasePrueba ? 'prueba' : 'recurrente'
        setTipoClase(tipoActual === 'recurrente' && !canUseRecurrentes ? 'prueba' : tipoActual)
        setFrecuencia(clase.frecuenciaSemanal)
        setDiasSeleccionados(clase.diasSemana || [])
        setAlumnosSeleccionados(clase.alumno?.id ? [clase.alumno.id] : [])
      } else {
        // Nueva clase: usar recurrente solo si tiene permisos
        setTipoClase(canUseRecurrentes ? 'recurrente' : 'prueba')
        setFrecuencia(null)
        setDiasSeleccionados([])
        setAlumnosSeleccionados([])
      }
      setError(null)
    }
  }, [isOpen, clase, canUseRecurrentes])

  const handleDiaToggle = (dia: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(dia)) {
        // Si ya está seleccionado, quitarlo
        return prev.filter(d => d !== dia)
      } else {
        // Si no está seleccionado, agregarlo
        if (frecuencia && prev.length >= frecuencia) {
          // Si ya se alcanzó el límite, reemplazar el primer día seleccionado
          return [...prev.slice(1), dia]
        }
        return [...prev, dia]
      }
    })
  }

  const handleAlumnoToggle = (alumnoId: string) => {
    setAlumnosSeleccionados(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(id => id !== alumnoId)
      } else {
        if (prev.length >= maxAlumnosPorClase) {
          return prev
        }
        return [...prev, alumnoId]
      }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (esRecurrente && (!frecuencia || diasSeleccionados.length !== frecuencia)) {
      setError(`Debes seleccionar exactamente ${frecuencia} día${frecuencia === 1 ? '' : 's'}`)
      return
    }

    if (alumnosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un alumno')
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
        // Al editar, solo actualizamos la clase actual con el primer alumno seleccionado
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
        // Al crear, pasamos todos los alumnos seleccionados
        const result = await createClaseAPI({
          alumnoIds: alumnosSeleccionados,
          horaInicio,
          horaRecurrente: horaRecurrente || undefined,
          esClasePrueba,
          esRecurrente,
          frecuenciaSemanal: frecuencia || undefined,
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

  const defaultFecha = clase ? format(clase.fecha, 'yyyy-MM-dd') : fecha ? format(fecha, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="btn-ghost"
        disabled={isLoading}
      >
        Cancelar clase
      </button>
      <button
        type="submit"
        form="clase-form"
        className="btn-primary"
        disabled={isLoading}
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
        <div className="form-message error">
          {error}
        </div>
      )}

      <form id="clase-form" onSubmit={handleSubmit}>
        <input type="hidden" name="esRecurrente" value={esRecurrente ? 'true' : 'false'} />
        {esRecurrente && frecuencia && (
          <input type="hidden" name="frecuenciaSemanal" value={frecuencia} />
        )}

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
                const alumno = alumnos.find(a => a.id === id)
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
              onChange={(e) => {
                if (e.target.value) {
                  handleAlumnoToggle(e.target.value)
                }
              }}
              disabled={isLoading}
            >
              <option value="">Agregar alumno...</option>
              {alumnos
                .filter(a => !alumnosSeleccionados.includes(a.id))
                .map(alumno => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre}
                  </option>
                ))}
            </SelectInput>
          )}
        </div>

        <div className="form-group">
          <label>Fecha</label>
          <DateInput
            name="fecha"
            required
            defaultValue={defaultFecha}
            disabled={isLoading}
          />
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
              onClick={() => {
                setTipoClase('prueba')
                setFrecuencia(null)
                setDiasSeleccionados([])
              }}
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

        {esRecurrente && (
          <div className="form-group">
            <label>Frecuencia</label>
            <SelectInput
              required
              disabled={isLoading}
              value={frecuencia?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null
                setFrecuencia(value)
                setDiasSeleccionados([])
              }}
            >
              <option value="">Seleccionar frecuencia...</option>
              <option value="1">1 vez por semana</option>
              <option value="2">2 veces por semana</option>
              <option value="3">3 veces por semana</option>
              <option value="4">4 veces por semana</option>
              <option value="5">5 veces por semana</option>
            </SelectInput>
          </div>
        )}

        {esRecurrente && frecuencia && (
          <>
            <div className="form-group">
              <label>
                ¿Qué día{frecuencia > 1 ? 's' : ''}?
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
                Dejá vacío para usar la misma hora que la clase inicial
              </small>
            </div>

            <div className="form-group">
              <label>Pack del alumno</label>
              <SelectInput
                name="packId"
                disabled={isLoading}
              >
                <option value="">Por clase{precioPorClase && precioPorClase !== '0' ? ` - $${precioPorClase}` : ''}</option>
                {packs.map(pack => (
                  <option key={pack.id} value={pack.id}>
                    {pack.nombre} - {pack.clasesPorSemana}x/semana - ${pack.precio}
                  </option>
                ))}
              </SelectInput>
            </div>

            {!clase && diasSeleccionados.length === frecuencia && (
              <div className="form-hint-info">
                ℹ️ Se crearán {diasSeleccionados.length} clases por semana durante las próximas 8 semanas (total: {diasSeleccionados.length * 8} clases recurrentes + 1 clase inicial)
              </div>
            )}
          </>
        )}
      </form>
    </DialogBase>
  )
}