'use client'

import { HorariosDisponibles } from './horarios-disponibles'
import { HorarioDialog } from './horario-dialog'
import { PacksSection } from './packs-section'
import { updatePreferencias } from './actions'
import { useState, useMemo } from 'react'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import { TimeInput } from '@/components/time-input'
import type { Horario, Pack, ProfesorConfig } from '@/lib/types'

interface ConfiguracionClientProps {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
}

export function ConfiguracionClient({ profesor, horarios: initialHorarios, packs }: ConfiguracionClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>(initialHorarios)
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false)
  const [horarioToEdit, setHorarioToEdit] = useState<Horario | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      invalidateCache(CACHE_KEYS.ALUMNOS)
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  // Transformar horarios de DB a formato para HorariosDisponibles
  const DIAS_NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

  const horariosAgrupados = useMemo(() => {
    const result = []

    // Crear un mapa de día -> horario
    const horariosPorDia = new Map<number, Horario>()
    horarios.forEach(h => {
      horariosPorDia.set(h.diaSemana, h)
    })

    // Grupo de lunes a viernes (1-5)
    const diasSemana = [1, 2, 3, 4, 5] // lunes a viernes
    const horariosLV = diasSemana.map(d => horariosPorDia.get(d)).filter(Boolean) as Horario[]

    if (horariosLV.length > 0) {
      // Verificar si todos tienen el mismo horario
      const primerHorario = horariosLV[0]
      const todosMismoHorario = horariosLV.every(h =>
        h.horaInicio === primerHorario.horaInicio &&
        h.horaFin === primerHorario.horaFin &&
        h.esManiana === primerHorario.esManiana
      )

      if (todosMismoHorario && horariosLV.length === 5) {
        // Agrupar todos
        result.push({
          id: horariosLV.map(h => h.id).join('-'),
          dias: diasSemana.map(d => DIAS_NOMBRES[d]),
          inicio: primerHorario.horaInicio,
          fin: primerHorario.horaFin,
          turno: primerHorario.esManiana ? 'Mañana' : 'Tarde',
          disponible: primerHorario.estaActivo
        })
      } else {
        // Agregar individualmente
        diasSemana.forEach(dia => {
          const h = horariosPorDia.get(dia)
          if (h) {
            result.push({
              id: h.id,
              dias: [DIAS_NOMBRES[dia]],
              inicio: h.horaInicio,
              fin: h.horaFin,
              turno: h.esManiana ? 'Mañana' : 'Tarde',
              disponible: h.estaActivo
            })
          } else {
            result.push({
              id: `no-disponible-${dia}`,
              dias: [DIAS_NOMBRES[dia]],
              inicio: '',
              fin: '',
              turno: '',
              disponible: false
            })
          }
        })
      }
    } else {
      // Agregar días individuales sin horario
      diasSemana.forEach(dia => {
        result.push({
          id: `no-disponible-${dia}`,
          dias: [DIAS_NOMBRES[dia]],
          inicio: '',
          fin: '',
          turno: '',
          disponible: false
        })
      })
    }

    // Sábado (6)
    const sabado = horariosPorDia.get(6)
    if (sabado) {
      result.push({
        id: sabado.id,
        dias: ['sábado'],
        inicio: sabado.horaInicio,
        fin: sabado.horaFin,
        turno: sabado.esManiana ? 'Mañana' : 'Tarde',
        disponible: sabado.estaActivo
      })
    } else {
      result.push({
        id: 'no-disponible-6',
        dias: ['sábado'],
        inicio: '',
        fin: '',
        turno: '',
        disponible: false
      })
    }

    // Domingo (0)
    const domingo = horariosPorDia.get(0)
    if (domingo) {
      result.push({
        id: domingo.id,
        dias: ['domingo'],
        inicio: domingo.horaInicio,
        fin: domingo.horaFin,
        turno: domingo.esManiana ? 'Mañana' : 'Tarde',
        disponible: domingo.estaActivo
      })
    } else {
      result.push({
        id: 'no-disponible-0',
        dias: ['domingo'],
        inicio: '',
        fin: '',
        turno: '',
        disponible: false
      })
    }

    return result
  }, [horarios])

  return (
    <>
    <form onSubmit={handleSubmit}>
      {/* Sección 1: Horarios Disponibles */}
      <div className="settings-section">
        <HorariosDisponibles
          horarios={horariosAgrupados}
          onAgregarHorario={() => {
            setHorarioToEdit(null)
            setHorarioDialogOpen(true)
          }}
          onEditar={(id) => {
            // El ID puede ser un UUID simple o varios UUIDs unidos con '-'
            // Los UUIDs tienen formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            // Si hay más de 5 guiones, es un ID compuesto
            const guiones = (id.match(/-/g) || []).length
            let horarioId: string

            if (guiones > 4) {
              // ID compuesto - tomar el primer UUID (36 caracteres)
              horarioId = id.substring(0, 36)
            } else {
              horarioId = id
            }

            const horario = horarios.find(h => h.id === horarioId)
            if (horario) {
              setHorarioToEdit(horario)
              setHorarioDialogOpen(true)
            }
          }}
          onEliminar={(id) => console.log('eliminar', id)}
          onAgregarDisponibilidad={(dia) => {
            setHorarioToEdit(null)
            setHorarioDialogOpen(true)
          }}
        />
      </div>

      {/* Sección 2: Configuración de Clases */}
      <div className="settings-section">
        <div className="section-content">
          <div className="section-header">
            <h2>Configuración de Clases</h2>
            <p className="section-subtitle">Horarios por defecto y capacidad</p>
          </div>

          <div className="form-content">
            <div className="form-group">
              <label>Horario de Mañana por Default</label>
              <div className="form-row">
                <TimeInput
                  name="horarioMananaInicio"
                  defaultValue={profesor.horarioMananaInicio}
                  disabled={isLoading}
                />
                <TimeInput
                  name="horarioMananaFin"
                  defaultValue={profesor.horarioMananaFin}
                  disabled={isLoading}
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de mañana</p>
            </div>

            <div className="form-group">
              <label>Horario de Tarde por Default</label>
              <div className="form-row">
                <TimeInput
                  name="horarioTardeInicio"
                  defaultValue={profesor.horarioTardeInicio}
                  disabled={isLoading}
                />
                <TimeInput
                  name="horarioTardeFin"
                  defaultValue={profesor.horarioTardeFin}
                  disabled={isLoading}
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de tarde</p>
            </div>

            <div className="form-group">
              <label>Capacidad Máxima por Clase</label>
              <select
                name="maxAlumnosPorClase"
                defaultValue={profesor.maxAlumnosPorClase}
                required
                disabled={isLoading}
                className="form-select"
              >
                <option value="1">1 alumno</option>
                <option value="2">2 alumnos</option>
                <option value="3">3 alumnos</option>
                <option value="4">4 alumnos</option>
                <option value="5">5 alumnos</option>
                <option value="6">6 alumnos</option>
                <option value="8">8 alumnos</option>
                <option value="10">10 alumnos</option>
              </select>
              <p className="form-hint">Cantidad máxima de alumnos que pueden reservar la misma clase</p>
            </div>

            <div className="form-group">
              <label>Anticipación Mínima para Reservas</label>
              <select
                name="horasAnticipacionMinima"
                defaultValue={profesor.horasAnticipacionMinima}
                required
                disabled={isLoading}
                className="form-select"
              >
                <option value="1">1 hora</option>
                <option value="2">2 horas</option>
                <option value="3">3 horas</option>
                <option value="4">4 horas</option>
                <option value="6">6 horas</option>
                <option value="12">12 horas</option>
                <option value="24">24 horas</option>
              </select>
              <p className="form-hint">Tiempo mínimo de anticipación que deben tener los alumnos para reservar clases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Precios y Paquetes */}
      <div className="settings-section">
        <div className="section-content">
          <div className="section-header">
            <h2>Precios y Paquetes</h2>
            <p className="section-subtitle">Tarifas y paquetes de clases</p>
          </div>

          <div className="form-content">
            <div className="form-group">
              <label>Precio por Clase Suelta</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>$</span>
                <input
                  type="number"
                  name="precioPorClase"
                  defaultValue={profesor.precioPorClase}
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  style={{ paddingLeft: '1.5rem', width: '100%' }}
                  placeholder="0.00"
                />
              </div>
              <p className="form-hint">Precio para alumnos que pagan por clase individual</p>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-header">
              <h3>Paquetes de Clases</h3>
              <p className="section-subtitle">Configurá tus paquetes con precios personalizados</p>
            </div>
            <PacksSection packs={packs} />
          </div>
        </div>
      </div>

      {/* Sección 4: Avanzado */}
      <div className="settings-section">
        <div className="section-content">
          <div className="section-header">
            <h2>Avanzado</h2>
            <p className="section-subtitle">Configuración para espacios compartidos</p>
          </div>

          <div className="form-content">
            <div className="form-group">
              <label>Espacio Compartido</label>
              <input
                type="text"
                name="espacioCompartidoId"
                defaultValue={profesor.espacioCompartidoId || ''}
                placeholder="Código de espacio (ej: studio-palermo)"
                disabled={isLoading}
                className="form-input"
              />
              <p className="form-hint">
                Si trabajás con otros profesores en el mismo lugar, usá el mismo código para coordinar horarios.
                Todos los profesores con el mismo código verán las clases de las demás en su calendario.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="settings-actions">
        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}
        <button type="submit" className="btn-primary btn-lg" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>

    {/* Dialog de horarios - fuera del form */}
    <HorarioDialog
      isOpen={horarioDialogOpen}
      onClose={() => {
        setHorarioDialogOpen(false)
        setHorarioToEdit(null)
      }}
      horario={horarioToEdit}
      horarios={horarios}
      horarioMananaInicio={profesor.horarioMananaInicio}
      horarioMananaFin={profesor.horarioMananaFin}
      horarioTardeInicio={profesor.horarioTardeInicio}
      horarioTardeFin={profesor.horarioTardeFin}
      onSuccess={(horario, isEdit) => {
        if (isEdit) {
          setHorarios(prev => prev.map(h => h.id === horario.id ? horario : h))
        } else {
          setHorarios(prev => [...prev, horario])
        }
      }}
      onBatchCreate={(nuevosHorarios) => {
        setHorarios(prev => {
          // Filtrar temporales y agregar los nuevos
          const sinTemporales = prev.filter(h => !h.id.startsWith('temp-'))
          return [...sinTemporales, ...nuevosHorarios]
        })
      }}
    />
    </>
  )
}
