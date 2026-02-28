'use client'

import { useState, useEffect } from 'react'
import { saveHorarioAPI, saveHorariosBatchAPI } from '@/lib/api'
import { ConfirmDialog } from './confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { Sun, Moon } from 'lucide-react'
import { TimeInput } from '@/components/time-input'
import { DialogBase } from '@/components/ui/dialog-base'
import type { Horario } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

const RANGOS_DIAS = [
  { value: 'single', label: 'Un solo día', dias: [] },
  { value: 'lun-vie', label: 'Lunes a Viernes', dias: [1, 2, 3, 4, 5] },
  { value: 'lun-sab', label: 'Lunes a Sábado', dias: [1, 2, 3, 4, 5, 6] },
]

const DIAS_INDIVIDUALES = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const TURNOS = [
  { value: 'maniana', label: 'Mañana', icon: 'sun' },
  { value: 'tarde', label: 'Tarde', icon: 'moon' },
]

function TurnoIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === 'sun') return <Sun size={size} className="turno-icon turno-icon-sun" />
  if (type === 'moon') return <Moon size={size} className="turno-icon turno-icon-moon" />
  return null
}

type HorarioDialogProps = {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
  horarios: Horario[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  onSuccess?: (horario: Horario, isEdit: boolean) => void
  onBatchCreate?: (horarios: Horario[]) => void
}

export function HorarioDialog({
  isOpen,
  onClose,
  horario,
  horarios,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin,
  onSuccess,
  onBatchCreate
}: HorarioDialogProps) {
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rangoSeleccionado, setRangoSeleccionado] = useState('single')
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('maniana')
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null)
  const [confirmType, setConfirmType] = useState<'sabado-tarde' | 'domingo' | null>(null)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  // Check if Saturday has any tarde shifts configured
  const sabadoTieneTarde = horarios.some(h => h.diaSemana === 6 && !h.esManiana)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setRangoSeleccionado('single')
      setTurnoSeleccionado('maniana')
      setPendingSubmit(null)
      setConfirmType(null)
      setHoraInicio('')
      setHoraFin('')
    } else if (horario) {
      // Si estamos editando, setear el turno según el horario
      setTurnoSeleccionado(horario.esManiana ? 'maniana' : 'tarde')
    } else {
      // Nuevo horario - setear mañana por defecto
      setTurnoSeleccionado('maniana')
    }
  }, [isOpen, horario])

  // Actualizar las horas cuando cambia el turno
  useEffect(() => {
    if (isOpen) {
      // Actualizar SIEMPRE que cambie el turno, tanto en crear como en editar
      if (turnoSeleccionado === 'maniana') {
        setHoraInicio(horarioMananaInicio)
        setHoraFin(horarioMananaFin)
      } else if (turnoSeleccionado === 'tarde') {
        setHoraInicio(horarioTardeInicio)
        setHoraFin(horarioTardeFin)
      }
    }
  }, [turnoSeleccionado, isOpen, horarioMananaInicio, horarioMananaFin, horarioTardeInicio, horarioTardeFin])

  function buildHorariosToCreate(formData: FormData, excluirSabadoTarde: boolean = false, excluirDomingo: boolean = false): Array<{ diaSemana: number; horaInicio: string; horaFin: string; esManiana: boolean }> {
    const rango = RANGOS_DIAS.find(r => r.value === rangoSeleccionado)
    const horariosToCreate: Array<{ diaSemana: number; horaInicio: string; horaFin: string; esManiana: boolean }> = []

    if (rango && rango.dias.length > 0) {
      for (const dia of rango.dias) {
        if (excluirSabadoTarde && dia === 6 && (turnoSeleccionado === 'tarde' || turnoSeleccionado === 'ambos')) {
          if (turnoSeleccionado === 'tarde') continue
          horariosToCreate.push({
            diaSemana: dia,
            horaInicio: formData.get('horaInicioManiana') as string,
            horaFin: formData.get('horaFinManiana') as string,
            esManiana: true
          })
          continue
        }

        if (excluirDomingo && dia === 0) continue

        if (turnoSeleccionado === 'ambos') {
          horariosToCreate.push({
            diaSemana: dia,
            horaInicio: formData.get('horaInicioManiana') as string,
            horaFin: formData.get('horaFinManiana') as string,
            esManiana: true
          })

          if (dia !== 6 || sabadoTieneTarde) {
            horariosToCreate.push({
              diaSemana: dia,
              horaInicio: formData.get('horaInicioTarde') as string,
              horaFin: formData.get('horaFinTarde') as string,
              esManiana: false
            })
          }
        } else {
          horariosToCreate.push({
            diaSemana: dia,
            horaInicio: formData.get('horaInicio') as string,
            horaFin: formData.get('horaFin') as string,
            esManiana: turnoSeleccionado === 'maniana'
          })
        }
      }
    } else {
      const diaSemana = parseInt(formData.get('diaSemana') as string)

      if (turnoSeleccionado === 'ambos') {
        horariosToCreate.push({
          diaSemana,
          horaInicio: formData.get('horaInicioManiana') as string,
          horaFin: formData.get('horaFinManiana') as string,
          esManiana: true
        })

        if (diaSemana !== 6 || sabadoTieneTarde) {
          horariosToCreate.push({
            diaSemana,
            horaInicio: formData.get('horaInicioTarde') as string,
            horaFin: formData.get('horaFinTarde') as string,
            esManiana: false
          })
        }
      } else {
        horariosToCreate.push({
          diaSemana,
          horaInicio: formData.get('horaInicio') as string,
          horaFin: formData.get('horaFin') as string,
          esManiana: turnoSeleccionado === 'maniana'
        })
      }
    }

    return horariosToCreate
  }

  async function procesarHorarios(formData: FormData, excluirSabadoTarde: boolean = false, excluirDomingo: boolean = false): Promise<Horario[]> {
    setIsLoading(true)
    const horariosToCreate = buildHorariosToCreate(formData, excluirSabadoTarde, excluirDomingo)

    // Crear horarios optimistas con IDs temporales
    const optimisticHorarios: Horario[] = horariosToCreate.map((h, i) => ({
      id: `temp-${Date.now()}-${i}`,
      diaSemana: h.diaSemana,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      esManiana: h.esManiana,
      estaActivo: true
    }))

    // Actualizar UI inmediatamente
    onBatchCreate?.(optimisticHorarios)
    onClose()
    showSuccess('Horario(s) creado(s)')

    // Llamar API en background y actualizar con IDs reales
    saveHorariosBatchAPI(horariosToCreate)
      .then(result => {
        if (result.horarios) {
          onBatchCreate?.(result.horarios)
        }
      })
      .catch(err => {
        showError(getErrorMessage(err) || 'Error al guardar horarios')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return optimisticHorarios
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const rango = RANGOS_DIAS.find(r => r.value === rangoSeleccionado)
    const diaUnico = rangoSeleccionado === 'single' ? parseInt(formData.get('diaSemana') as string) : null
    const diasACrear = rango && rango.dias.length > 0 ? rango.dias : (diaUnico !== null ? [diaUnico] : [])

    const incluySabadoTarde = diasACrear.includes(6) && (turnoSeleccionado === 'tarde' || turnoSeleccionado === 'ambos')
    if (!horario && incluySabadoTarde) {
      setPendingSubmit(formData)
      setConfirmType('sabado-tarde')
      return
    }

    const incluyeDomingo = diasACrear.includes(0)
    if (!horario && incluyeDomingo) {
      setPendingSubmit(formData)
      setConfirmType('domingo')
      return
    }

    if (horario) {
      // Edición - optimistic update
      setIsLoading(true)
      const updatedHorario: Horario = {
        ...horario,
        horaInicio: formData.get('horaInicio') as string,
        horaFin: formData.get('horaFin') as string,
        esManiana: turnoSeleccionado === 'maniana'
      }
      onSuccess?.(updatedHorario, true)
      onClose()
      showSuccess('Horario actualizado')

      // API call en background
      saveHorarioAPI({
        id: horario.id,
        diaSemana: horario.diaSemana,
        horaInicio: formData.get('horaInicio') as string,
        horaFin: formData.get('horaFin') as string,
        esManiana: turnoSeleccionado === 'maniana'
      }).catch(err => {
        showError(getErrorMessage(err) || 'Error al guardar horario')
      }).finally(() => {
        setIsLoading(false)
      })
    } else {
      // Creación batch - procesarHorarios ya hace optimistic update
      await procesarHorarios(formData)
    }
  }

  async function handleConfirm(option: 'incluir' | 'excluir') {
    if (!pendingSubmit) return
    setConfirmType(null)

    // procesarHorarios ya hace optimistic update, cierra dialog y muestra success
    if (confirmType === 'sabado-tarde') {
      await procesarHorarios(pendingSubmit, option === 'excluir')
    } else if (confirmType === 'domingo') {
      await procesarHorarios(pendingSubmit, false, option === 'excluir')
    }

    setPendingSubmit(null)
  }

  const dialogTitle = horario ? (
    <span className="dialog-title-with-badge">
      Editar Horario
      <span className="dialog-title-badge">
        {DIAS_INDIVIDUALES.find(d => d.value === horario.diaSemana)?.label}
      </span>
    </span>
  ) : 'Nuevo Horario'

  const footerButtons = (
    <>
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
        form="horario-form"
        className="btn-primary"
        disabled={isLoading}
      >
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </>
  )

  return (
    <>
      <DialogBase
        isOpen={isOpen}
        onClose={onClose}
        title={typeof dialogTitle === 'string' ? dialogTitle : 'Horario'}
        footer={footerButtons}
      >
        {typeof dialogTitle !== 'string' && (
          <div className="dialog-title-override" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>
            {dialogTitle}
          </div>
        )}

        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}

        <form id="horario-form" onSubmit={handleSubmit}>
          {!horario && (
            <>
              <div className="form-group">
                <span className="form-label">¿Qué días?</span>
                <div className="rango-grid">
                  {RANGOS_DIAS.map(rango => (
                    <button
                      key={rango.value}
                      type="button"
                      className={`rango-btn ${rangoSeleccionado === rango.value ? 'active' : ''}`}
                      onClick={() => setRangoSeleccionado(rango.value)}
                    >
                      {rango.label}
                    </button>
                  ))}
                </div>
              </div>

              {rangoSeleccionado === 'single' && (
                <div className="form-group">
                  <span className="form-label">Elegí el día</span>
                  <div className="dias-grid">
                    {DIAS_INDIVIDUALES.map(dia => (
                      <label key={dia.value} className="dia-option">
                        <input
                          type="radio"
                          name="diaSemana"
                          value={dia.value}
                          required
                        />
                        <span>{dia.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <span className="form-label">Turno</span>
                <div className="turno-grid">
                  {TURNOS.map(turno => (
                    <button
                      key={turno.value}
                      type="button"
                      className={`turno-btn ${turnoSeleccionado === turno.value ? 'active' : ''}`}
                      onClick={() => setTurnoSeleccionado(turno.value)}
                    >
                      <TurnoIcon type={turno.icon} />
                      <span className="turno-label">{turno.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {horario && (
            <div className="form-group">
              <span className="form-label">Turno</span>
              <div className="turno-grid">
                <button
                  type="button"
                  className={`turno-btn ${turnoSeleccionado === 'maniana' ? 'active' : ''}`}
                  onClick={() => setTurnoSeleccionado('maniana')}
                >
                  <TurnoIcon type="sun" />
                  <span className="turno-label">Mañana</span>
                </button>
                <button
                  type="button"
                  className={`turno-btn ${turnoSeleccionado === 'tarde' ? 'active' : ''}`}
                  onClick={() => setTurnoSeleccionado('tarde')}
                >
                  <TurnoIcon type="moon" />
                  <span className="turno-label">Tarde</span>
                </button>
              </div>
            </div>
          )}

          {turnoSeleccionado === 'ambos' && !horario && (
            <>
              <div className="form-group">
                <span className="form-label label-with-icon"><Sun size={16} className="turno-icon-sun" /> Horario Mañana</span>
                <div className="form-row">
                  <TimeInput
                    name="horaInicioManiana"
                    defaultValue={horarioMananaInicio}
                    disabled={isLoading}
                  />
                  <TimeInput
                    name="horaFinManiana"
                    defaultValue={horarioMananaFin}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <span className="form-label label-with-icon"><Moon size={16} className="turno-icon-moon" /> Horario Tarde</span>
                <div className="form-row">
                  <TimeInput
                    name="horaInicioTarde"
                    defaultValue={horarioTardeInicio}
                    disabled={isLoading}
                  />
                  <TimeInput
                    name="horaFinTarde"
                    defaultValue={horarioTardeFin}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          {turnoSeleccionado !== 'ambos' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="horario-hora-inicio">Desde</label>
                <TimeInput
                  id="horario-hora-inicio"
                  name="horaInicio"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horario-hora-fin">Hasta</label>
                <TimeInput
                  id="horario-hora-fin"
                  name="horaFin"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!horario && rangoSeleccionado !== 'single' && (
            <input type="hidden" name="esManiana" value={turnoSeleccionado === 'maniana' ? 'true' : 'false'} />
          )}
        </form>
      </DialogBase>

      {confirmType && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmType(null)}
          onConfirm={handleConfirm}
          tipo={confirmType}
        />
      )}
    </>
  )
}