'use client'

import { useState, useEffect } from 'react'
import { createClaseAPI, updateClaseAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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
  alumno: {
    id: string
    nombre: string
  } | null
}

type Alumno = {
  id: string
  nombre: string
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

export function ClaseDialog({
  isOpen,
  onClose,
  clase,
  fecha,
  alumnos,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  fecha: Date | null
  alumnos: Alumno[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  onSuccess?: (data: { clase?: any; clases?: any[]; isNew: boolean }) => void
}) {
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [esClasePrueba, setEsClasePrueba] = useState(false)
  const [frecuencia, setFrecuencia] = useState<number | null>(null)
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      if (clase) {
        setEsRecurrente(clase.esRecurrente)
        setEsClasePrueba(clase.esClasePrueba)
        setFrecuencia(clase.frecuenciaSemanal)
        setDiasSeleccionados(clase.diasSemana || [])
      } else {
        setEsRecurrente(false)
        setEsClasePrueba(false)
        setFrecuencia(null)
        setDiasSeleccionados([])
      }
      setError(null)
    }
  }, [isOpen, clase])

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (esRecurrente && (!frecuencia || diasSeleccionados.length !== frecuencia)) {
      setError(`Debes seleccionar exactamente ${frecuencia} día${frecuencia === 1 ? '' : 's'}`)
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const alumnoId = formData.get('alumnoId') as string
    const horaInicio = formData.get('horaInicio') as string
    const horaRecurrente = formData.get('horaRecurrente') as string
    const fechaStr = formData.get('fecha') as string
    const estadoVal = formData.get('estado') as string

    try {
      if (clase) {
        const result = await updateClaseAPI({
          id: clase.id,
          alumnoId: alumnoId || undefined,
          horaInicio,
          horaRecurrente: horaRecurrente || undefined,
          estado: estadoVal || clase.estado,
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
          alumnoId: alumnoId || undefined,
          horaInicio,
          horaRecurrente: horaRecurrente || undefined,
          esClasePrueba,
          esRecurrente,
          frecuenciaSemanal: frecuencia || undefined,
          diasSemana: esRecurrente ? diasSeleccionados : undefined,
          fecha: fechaStr
        })
        showSuccess(esRecurrente ? 'Clases creadas' : 'Clase creada')
        onSuccess?.({ clase: result.clase, isNew: true })
      }
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al guardar clase')
      setError(err.message || 'Error al guardar clase')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultFecha = clase ? format(clase.fecha, 'yyyy-MM-dd') : fecha ? format(fecha, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{clase ? 'Editar Clase' : 'Nueva Clase'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-body">
          <input type="hidden" name="esRecurrente" value={esRecurrente ? 'true' : 'false'} />
          {esRecurrente && frecuencia && (
            <input type="hidden" name="frecuenciaSemanal" value={frecuencia} />
          )}
          
          <div className="form-group">
            <label>Alumno</label>
            <select
              name="alumnoId"
              defaultValue={clase?.alumno?.id || ''}
              disabled={isLoading}
            >
              <option value="">Sin asignar (disponible)</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              name="fecha"
              required
              defaultValue={defaultFecha}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Hora inicial</label>
            <input
              type="time"
              name="horaInicio"
              required
              defaultValue={clase?.horaInicio || horarioMananaInicio}
              disabled={isLoading}
            />
          </div>

          {clase && (
            <div className="form-group">
              <label>Estado</label>
              <select
                name="estado"
                defaultValue={clase.estado}
                disabled={isLoading}
              >
                <option value="reservada">Reservada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="esClasePrueba"
                checked={esClasePrueba}
                onChange={(e) => {
                  setEsClasePrueba(e.target.checked)
                  if (e.target.checked) {
                    setEsRecurrente(false)
                    setFrecuencia(null)
                    setDiasSeleccionados([])
                  }
                }}
                disabled={isLoading}
              />
              <span>Es clase de prueba</span>
            </label>
          </div>

          {!esClasePrueba && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={esRecurrente}
                  onChange={(e) => {
                    setEsRecurrente(e.target.checked)
                    if (!e.target.checked) {
                      setFrecuencia(null)
                      setDiasSeleccionados([])
                    }
                  }}
                  disabled={isLoading}
                />
                <span>
                  {clase ? 'Es clase recurrente' : 'Crear como clase recurrente'}
                </span>
              </label>
            </div>
          )}

          {esRecurrente && (
            <>
              <div className="form-group">
                <label>¿Cuántas veces por semana?</label>
                <select
                  required
                  disabled={isLoading}
                  value={frecuencia || ''}
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
                </select>
              </div>

              {frecuencia && (
                <>
                  <div className="form-group">
                    <label>
                      ¿Qué día{frecuencia > 1 ? 's' : ''}? 
                      <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '0.5rem' }}>
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
                    <input
                      type="time"
                      name="horaRecurrente"
                      defaultValue={clase?.horaRecurrente || horarioMananaInicio}
                      disabled={isLoading}
                    />
                    <small style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', display: 'block' }}>
                      Dejá vacío para usar la misma hora que la clase inicial
                    </small>
                  </div>
                </>
              )}

              {!clase && frecuencia && diasSeleccionados.length === frecuencia && (
                <div className="form-hint-info">
                  ℹ️ Se crearán {diasSeleccionados.length} clases por semana durante las próximas 8 semanas (total: {diasSeleccionados.length * 8} clases recurrentes + 1 clase inicial)
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}