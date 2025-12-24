'use client'

import { HorariosDisponibles } from './horarios-disponibles'
import { HorarioDialog } from './horario-dialog'
import { PacksSection } from './packs-section'
import { PortalSection } from './portal-section'
import { updatePreferencias } from './actions'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import { TimeInput } from '@/components/time-input'
import { SelectInput } from '@/components/select-input'
import type { Horario, Pack, ProfesorConfig, ConfigFeatures } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

const DIAS_NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

interface ConfiguracionClientProps {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
  features: ConfigFeatures
}

export function ConfiguracionClient({ profesor, horarios: initialHorarios, packs, features }: ConfiguracionClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>(initialHorarios)
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false)
  const [horarioToEdit, setHorarioToEdit] = useState<Horario | null>(null)
  const [turnoMananaActivo, setTurnoMananaActivo] = useState(profesor.turnoMananaActivo)
  const [turnoTardeActivo, setTurnoTardeActivo] = useState(profesor.turnoTardeActivo)

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
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al guardar configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  // Transformar horarios de DB a formato para HorariosDisponibles
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
          onEliminar={(_id) => { /* Eliminación manejada en HorariosSection */ }}
          onAgregarDisponibilidad={(_dia) => {
            setHorarioToEdit(null)
            setHorarioDialogOpen(true)
          }}
          canConfigureHorarios={features.configuracionHorarios}
          currentPlan={features.plan}
        />
      </div>

      {/* Sección 2: Configuración de Clases */}
      <div className="settings-section">
        <div className="section-content">
          <div className="section-header">
            <h2>Configuración de Clases</h2>
          </div>

          <div className="config-grid-2">
            <div className="form-group">
              <label>Capacidad máxima por clase</label>
              <SelectInput
                name="maxAlumnosPorClase"
                defaultValue={profesor.maxAlumnosPorClase.toString()}
                required
                disabled={isLoading}
                className="form-select"
              >
                {[1,2,3,4,5,6,8,10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'alumno' : 'alumnos'}</option>
                ))}
              </SelectInput>
            </div>

            <div className="form-group">
              <label>Anticipación mínima para reservar</label>
              <SelectInput
                name="horasAnticipacionMinima"
                defaultValue={profesor.horasAnticipacionMinima.toString()}
                required
                disabled={isLoading}
                className="form-select"
              >
                {[1,2,3,4,6,12,24].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'hora' : 'horas'} antes</option>
                ))}
              </SelectInput>
            </div>
          </div>

          {/* Turnos disponibles */}
          <div className="turnos-section">
            <h3 className="turnos-title">Turnos en los que das clases</h3>

            <div className="turnos-grid">
              {/* Turno Mañana */}
              <div className={`turno-card ${turnoMananaActivo ? 'active' : ''}`}>
                <div className="turno-header">
                  <span className="turno-name">Mañana</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="turnoMananaActivo"
                      checked={turnoMananaActivo}
                      onChange={(e) => setTurnoMananaActivo(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {turnoMananaActivo && (
                  <div className="turno-horarios">
                    <TimeInput
                      name="horarioMananaInicio"
                      defaultValue={profesor.horarioMananaInicio}
                      disabled={isLoading}
                    />
                    <span className="horario-separator">a</span>
                    <TimeInput
                      name="horarioMananaFin"
                      defaultValue={profesor.horarioMananaFin}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Turno Tarde */}
              <div className={`turno-card ${turnoTardeActivo ? 'active' : ''}`}>
                <div className="turno-header">
                  <span className="turno-name">Tarde</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="turnoTardeActivo"
                      checked={turnoTardeActivo}
                      onChange={(e) => setTurnoTardeActivo(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {turnoTardeActivo && (
                  <div className="turno-horarios">
                    <TimeInput
                      name="horarioTardeInicio"
                      defaultValue={profesor.horarioTardeInicio}
                      disabled={isLoading}
                    />
                    <span className="horario-separator">a</span>
                    <TimeInput
                      name="horarioTardeFin"
                      defaultValue={profesor.horarioTardeFin}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </form>

    {/* Sección 3: Paquetes - fuera del form para evitar submit accidental */}
    <div className="settings-section" style={{ marginTop: '2rem' }}>
      <div className="section-content">
        <PacksSection
          packs={packs}
          renderButton={(onClick) => (
            <div className="horarios-header">
              <div>
                <h2 className="horarios-header-title">Paquetes</h2>
                <p className="horarios-header-subtitle">Configurá los packs de clases disponibles</p>
              </div>
              <button onClick={onClick} className="btn-primary btn-sm">
                <Plus size={16} />
                <span>Nuevo</span>
              </button>
            </div>
          )}
        />

        {/* Clase suelta dentro de la sección de paquetes */}
        <div className="clase-suelta-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Clase suelta</label>
              <div className="price-input-wrapper">
                <span className="price-symbol">$</span>
                <input
                  type="number"
                  name="precioPorClase"
                  defaultValue={profesor.precioPorClase}
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  className="price-input"
                  placeholder="0"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Sección 4: Portal de Reservas */}
    <PortalSection
      slug={profesor.slug}
      portalActivo={profesor.portalActivo}
      portalDescripcion={profesor.portalDescripcion}
      canUsePortal={features.portalAlumnos}
      currentPlan={features.plan}
    />

    <form onSubmit={handleSubmit}>
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
