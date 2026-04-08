'use client'

import { HorariosDisponibles, type HorarioGrupo } from './horarios-disponibles'
import { HorarioDialog } from './horario-dialog'
import { PacksSection } from './packs-section'
import { updatePreferencias } from './actions'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import { TimeInput } from '@/components/time-input'
import { SelectInput } from '@/components/select-input'
import type { Horario, Pack, ProfesorConfig, ConfigFeatures } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { DIAS_SEMANA_COMPLETO } from '@/lib/constants'
import { saveHorarioAPI } from '@/lib/api'

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
  const [grupoEditIds, setGrupoEditIds] = useState<string[] | null>(null)

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

  console.log('horarios recibidos:', JSON.stringify(horarios, null, 2))
  // Transformar horarios de DB a formato para HorariosDisponibles
  const horariosAgrupados = useMemo(() => {
    const groups = new Map<string, Horario[]>()
    
    // 1. Agrupar por horario y turno (excluyendo los inactivos/bloqueados)
    horarios.forEach(h => {
      // Usamos una clave única para el grupo de horario/turno
      const key = `${h.horaInicio}-${h.horaFin}-${h.esManiana}-${h.estaActivo}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(h)
    })

    const result: HorarioGrupo[] = []

    // 2. Procesar grupos y formatear
    groups.forEach((grupoHorarios) => {
      // Ordenar días del grupo (1-6, 0)
      const sorted = [...grupoHorarios].sort((a, b) => {
        const d_a = a.diaSemana === 0 ? 7 : a.diaSemana
        const d_b = b.diaSemana === 0 ? 7 : b.diaSemana
        return d_a - d_b
      })

      const primero = sorted[0]
      result.push({
        id: sorted.map(h => h.id).join('|'),
        dias: sorted.map(h => DIAS_SEMANA_COMPLETO[h.diaSemana]),
        diasDetalle: sorted.map(h => ({ id: h.id, diaSemana: h.diaSemana })),
        inicio: primero.horaInicio,
        fin: primero.horaFin,
        turno: primero.esManiana ? 'Mañana' : 'Tarde',
        disponible: primero.estaActivo
      })
    })

    // 3. Ordenar los resultados finales por el primer día de cada grupo
    return result.sort((a, b) => {
      const first_a = a.diasDetalle[0].diaSemana === 0 ? 7 : a.diasDetalle[0].diaSemana
      const first_b = b.diasDetalle[0].diaSemana === 0 ? 7 : b.diasDetalle[0].diaSemana
      
      // Si el primer día es igual, ordenar por turno (Mañana antes que Tarde)
      if (first_a === first_b) {
        return a.turno === 'Mañana' ? -1 : 1
      }
      return first_a - first_b
    })
  }, [horarios])

  return (
    <>
    <form id="config-form" onSubmit={handleSubmit}>
      {/* Sección 1: Horarios Disponibles */}
      <div className="settings-section">
        {/* Turnos arriba, antes de la lista */}
        <div className="section-content">
          <div className="turnos-section">
            <h2 className="horarios-header-title" style={{ marginBottom: '0.875rem' }}>Turnos en los que das clases</h2>
            <div className="turnos-grid">
              {/* Turno Mañana */}
              <div className={`turno-card ${turnoMananaActivo ? 'active' : ''}`}>
                <div className="turno-header">
                  <span className="turno-name">Mañana</span>
                  <label className="toggle-switch">
                    <input type="checkbox" name="turnoMananaActivo" checked={turnoMananaActivo}
                      onChange={(e) => setTurnoMananaActivo(e.target.checked)} disabled={isLoading} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {turnoMananaActivo && (
                  <div className="turno-horarios">
                    <TimeInput name="horarioMananaInicio" defaultValue={profesor.horarioMananaInicio} disabled={isLoading} />
                    <span className="horario-separator">a</span>
                    <TimeInput name="horarioMananaFin" defaultValue={profesor.horarioMananaFin} disabled={isLoading} />
                  </div>
                )}
              </div>
              {/* Turno Tarde */}
              <div className={`turno-card ${turnoTardeActivo ? 'active' : ''}`}>
                <div className="turno-header">
                  <span className="turno-name">Tarde</span>
                  <label className="toggle-switch">
                    <input type="checkbox" name="turnoTardeActivo" checked={turnoTardeActivo}
                      onChange={(e) => setTurnoTardeActivo(e.target.checked)} disabled={isLoading} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {turnoTardeActivo && (
                  <div className="turno-horarios">
                    <TimeInput name="horarioTardeInicio" defaultValue={profesor.horarioTardeInicio} disabled={isLoading} />
                    <span className="horario-separator">a</span>
                    <TimeInput name="horarioTardeFin" defaultValue={profesor.horarioTardeFin} disabled={isLoading} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de horarios disponibles — separada visualmente */}
        <div className="section-content" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <HorariosDisponibles
            horarios={horariosAgrupados}
            onAgregarHorario={() => { setHorarioToEdit(null); setHorarioDialogOpen(true) }}
            onEditar={(id) => {
              if (id.includes('|')) {
                const ids = id.split('|')
                setGrupoEditIds(ids)
                const horario = horarios.find(h => h.id === ids[0])
                if (horario) {
                  setHorarioToEdit(horario)
                  setHorarioDialogOpen(true)
                }
              } else {
                setGrupoEditIds(null)
                const horario = horarios.find(h => h.id === id)
                if (horario) {
                  setHorarioToEdit(horario)
                  setHorarioDialogOpen(true)
                }
              }
            }}
            onEliminar={() => {}}
            onAgregarDisponibilidad={() => { setHorarioToEdit(null); setHorarioDialogOpen(true) }}
            canConfigureHorarios={features.configuracionHorarios}
          />
        </div>
      </div>

      {/* Sección 2: Configuración de Clases */}
      <div className="settings-section">
        <div className="section-content">
          <div className="horarios-header" style={{ marginBottom: '1.25rem' }}>
            <h2 className="horarios-header-title">Configuración de Clases</h2>
          </div>

          <div className="config-grid-2">
            <div className="form-group">
              <label htmlFor="config-max-alumnos">Capacidad máxima por clase</label>
              <SelectInput
                id="config-max-alumnos"
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
              <label htmlFor="config-horas-anticipacion">Anticipación mínima para reservar</label>
              <SelectInput
                id="config-horas-anticipacion"
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

          {/* Google Calendar - solo para plan Pro+ */}
          {features.googleCalendarSync && profesor.hasGoogleAccount && (
            <div className="form-group google-calendar-section">
              <label htmlFor="config-sync-google-calendar">Sincronizar con Google Calendar</label>
              <div className="sync-checkbox-group">
                <input
                  id="config-sync-google-calendar"
                  type="checkbox"
                  name="syncGoogleCalendar"
                  defaultChecked={profesor.syncGoogleCalendar}
                  disabled={isLoading}
                  className="sync-checkbox-input"
                />
                <span className="sync-checkbox-label">
                  Agregar clases automáticamente a Google Calendar
                </span>
              </div>
              <p className="form-hint">
                Las clases que crees se sincronizarán con tu calendario de Google.
              </p>
            </div>
          )}
        </div>
      </div>

    </form>

    {/* Sección 3: Precios — Clase suelta + Paquetes en un mismo container */}
    <div className="settings-section">
      <div className="section-content">
        {/* Clase suelta */}
        <div className="horarios-header" style={{ marginBottom: '1rem' }}>
          <h2 className="horarios-header-title">Precios</h2>
        </div>

          <div className="form-group" style={{ marginBottom: '0' }}>
            <label htmlFor="config-precio-por-clase">Clase suelta</label>
            <div className="price-input-wrapper">
              <span className="price-symbol">$</span>
              <input
                id="config-precio-por-clase"
                type="number"
                name="precioPorClase"
                form="config-form"
                defaultValue={profesor.precioPorClase}
                min="0"
                step="0.01"
                disabled={isLoading}
                className="price-input"
                placeholder="0"
              />
            </div>
          </div>

        {/* Divisor interno */}
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <PacksSection
            packs={packs}
            renderButton={(onClick) => (
              <div className="horarios-header" style={{ marginBottom: '0.75rem' }}>
                <h3 className="horarios-header-title">Paquetes</h3>
                <button type="button" onClick={onClick} className="btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Nuevo</span>
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </div>

    {/* Boton de guardar - al final de la pagina */}
    <div className="settings-actions">
      {message && (
        <div className={`form-message ${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <button type="submit" form="config-form" className="btn-primary btn-lg" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </div>

    {/* Dialog de horarios - fuera del form */}
    <HorarioDialog
      isOpen={horarioDialogOpen}
      onClose={() => {
        setHorarioDialogOpen(false)
        setHorarioToEdit(null)
        setGrupoEditIds(null)
      }}
      horario={horarioToEdit}
      horarios={horarios}
      horarioMananaInicio={profesor.horarioMananaInicio}
      horarioMananaFin={profesor.horarioMananaFin}
      horarioTardeInicio={profesor.horarioTardeInicio}
      horarioTardeFin={profesor.horarioTardeFin}
      grupoLabel={grupoEditIds ? 'Lunes a Viernes' : undefined}
      onSuccess={(horario, isEdit) => {
        if (isEdit && grupoEditIds) {
          // Edición de grupo: actualizar todos los horarios del grupo
          setHorarios(prev => prev.map(h =>
            grupoEditIds.includes(h.id)
              ? { ...h, horaInicio: horario.horaInicio, horaFin: horario.horaFin }
              : h
          ))
          // Batch API call para guardar todos
          Promise.all(
            grupoEditIds.map(id =>
              saveHorarioAPI({
                id,
                diaSemana: horario.diaSemana,
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                esManiana: horario.esManiana,
              })
            )
          ).catch(err => {
            setMessage({ type: 'error', text: getErrorMessage(err) || 'Error al guardar horarios' })
          })
          setGrupoEditIds(null)
        } else if (isEdit) {
          setHorarios(prev => prev.map(h => h.id === horario.id ? horario : h))
        } else {
          setHorarios(prev => [...prev, horario])
        }
      }}
      onBatchCreate={(nuevosHorarios) => {
        setHorarios(prev => {
          const nuevosKeys = new Set(
            nuevosHorarios.map(h => `${h.diaSemana}-${h.esManiana}`)
          )
          const sinDuplicados = prev.filter(
            h => !nuevosKeys.has(`${h.diaSemana}-${h.esManiana}`)
          )
          return [...sinDuplicados, ...nuevosHorarios]
        })
      }}
    />
    </>
  )
}
