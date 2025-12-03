'use client'

import { useState, useEffect } from 'react'
import { saveHorarioAPI } from '@/lib/api'
import { ConfirmDialog } from './confirm-dialog'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

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
  { value: 'maniana', label: 'Mañana', emoji: '☀️' },
  { value: 'tarde', label: 'Tarde', emoji: '🌙' },
  { value: 'ambos', label: 'Mañana y Tarde', emoji: '☀️🌙' },
]

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

  async function procesarHorarios(formData: FormData, excluirSabadoTarde: boolean = false, excluirDomingo: boolean = false): Promise<Horario[]> {
    const rango = RANGOS_DIAS.find(r => r.value === rangoSeleccionado)
    const horariosCreados: Horario[] = []

    if (rango && rango.dias.length > 0) {
      for (const dia of rango.dias) {
        if (excluirSabadoTarde && dia === 6 && (turnoSeleccionado === 'tarde' || turnoSeleccionado === 'ambos')) {
          if (turnoSeleccionado === 'tarde') continue
          const result = await saveHorarioAPI({
            diaSemana: dia,
            horaInicio: formData.get('horaInicioManiana') as string,
            horaFin: formData.get('horaFinManiana') as string,
            esManiana: true
          })
          if (result.horario) horariosCreados.push(result.horario)
          continue
        }

        if (excluirDomingo && dia === 0) continue

        if (turnoSeleccionado === 'ambos') {
          const result1 = await saveHorarioAPI({
            diaSemana: dia,
            horaInicio: formData.get('horaInicioManiana') as string,
            horaFin: formData.get('horaFinManiana') as string,
            esManiana: true
          })
          if (result1.horario) horariosCreados.push(result1.horario)

          // Skip tarde for Saturday if no tarde shifts are configured
          if (dia !== 6 || sabadoTieneTarde) {
            const result2 = await saveHorarioAPI({
              diaSemana: dia,
              horaInicio: formData.get('horaInicioTarde') as string,
              horaFin: formData.get('horaFinTarde') as string,
              esManiana: false
            })
            if (result2.horario) horariosCreados.push(result2.horario)
          }
        } else {
          const result = await saveHorarioAPI({
            diaSemana: dia,
            horaInicio: formData.get('horaInicio') as string,
            horaFin: formData.get('horaFin') as string,
            esManiana: turnoSeleccionado === 'maniana'
          })
          if (result.horario) horariosCreados.push(result.horario)
        }
      }
    } else {
      if (turnoSeleccionado === 'ambos') {
        const diaSemana = parseInt(formData.get('diaSemana') as string)

        const result1 = await saveHorarioAPI({
          diaSemana,
          horaInicio: formData.get('horaInicioManiana') as string,
          horaFin: formData.get('horaFinManiana') as string,
          esManiana: true
        })
        if (result1.horario) horariosCreados.push(result1.horario)

        // Skip tarde for Saturday if no tarde shifts are configured
        if (diaSemana !== 6 || sabadoTieneTarde) {
          const result2 = await saveHorarioAPI({
            diaSemana,
            horaInicio: formData.get('horaInicioTarde') as string,
            horaFin: formData.get('horaFinTarde') as string,
            esManiana: false
          })
          if (result2.horario) horariosCreados.push(result2.horario)
        }
      } else {
        const result = await saveHorarioAPI({
          diaSemana: parseInt(formData.get('diaSemana') as string),
          horaInicio: formData.get('horaInicio') as string,
          horaFin: formData.get('horaFin') as string,
          esManiana: turnoSeleccionado === 'maniana'
        })
        if (result.horario) horariosCreados.push(result.horario)
      }
    }

    return horariosCreados
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

    setIsLoading(true)
    setError(null)

    try {
      if (horario) {
        const result = await saveHorarioAPI({
          id: horario.id,
          diaSemana: parseInt(formData.get('diaSemana') as string) || horario.diaSemana,
          horaInicio: formData.get('horaInicio') as string,
          horaFin: formData.get('horaFin') as string,
          esManiana: turnoSeleccionado === 'maniana'
        })
        showSuccess('Horario actualizado')
        if (result.horario) {
          onSuccess?.(result.horario, true)
        }
      } else {
        const horariosCreados = await procesarHorarios(formData)
        showSuccess('Horario(s) creado(s)')
        onBatchCreate?.(horariosCreados)
      }
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al guardar horario')
      setError(err.message || 'Error al guardar horario')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm(option: 'incluir' | 'excluir') {
    if (!pendingSubmit) return

    setIsLoading(true)
    setError(null)
    setConfirmType(null)

    try {
      let horariosCreados: Horario[] = []
      if (confirmType === 'sabado-tarde') {
        horariosCreados = await procesarHorarios(pendingSubmit, option === 'excluir')
      } else if (confirmType === 'domingo') {
        horariosCreados = await procesarHorarios(pendingSubmit, false, option === 'excluir')
      }
      showSuccess('Horario(s) creado(s)')
      onBatchCreate?.(horariosCreados)
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al guardar horario')
      setError(err.message || 'Error al guardar horario')
    } finally {
      setIsLoading(false)
      setPendingSubmit(null)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="modal-mobile">
          <DialogHeader>
            <DialogTitle>{horario ? 'Editar Horario' : 'Nuevo Horario'}</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="form-message error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="dialog-body">
            {!horario && (
              <>
                <div className="form-group">
                  <label>¿Qué días?</label>
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
                    <label>Elegí el día</label>
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
                  <label>¿Qué turno?</label>
                  <div className="turno-grid">
                    {TURNOS.map(turno => (
                      <button
                        key={turno.value}
                        type="button"
                        className={`turno-btn ${turnoSeleccionado === turno.value ? 'active' : ''}`}
                        onClick={() => setTurnoSeleccionado(turno.value)}
                      >
                        <span className="turno-emoji">{turno.emoji}</span>
                        <span className="turno-label">{turno.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {horario && (
              <>
                <div className="form-group">
                  <label>Día</label>
                  <select name="diaSemana" defaultValue={horario.diaSemana} disabled>
                    {DIAS_INDIVIDUALES.map(dia => (
                      <option key={dia.value} value={dia.value}>{dia.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Turno</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="esManiana"
                        value="true"
                        checked={turnoSeleccionado === 'maniana'}
                        onChange={() => setTurnoSeleccionado('maniana')}
                      />
                      <span>☀️ Mañana</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="esManiana"
                        value="false"
                        checked={turnoSeleccionado === 'tarde'}
                        onChange={() => setTurnoSeleccionado('tarde')}
                      />
                      <span>🌙 Tarde</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {turnoSeleccionado === 'ambos' && !horario && (
              <>
                <div className="form-group">
                  <label>☀️ Horario Mañana</label>
                  <div className="form-row">
                    <input
                      type="time"
                      name="horaInicioManiana"
                      required
                      defaultValue={horarioMananaInicio}
                      disabled={isLoading}
                    />
                    <input
                      type="time"
                      name="horaFinManiana"
                      required
                      defaultValue={horarioMananaFin}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>🌙 Horario Tarde</label>
                  <div className="form-row">
                    <input
                      type="time"
                      name="horaInicioTarde"
                      required
                      defaultValue={horarioTardeInicio}
                      disabled={isLoading}
                    />
                    <input
                      type="time"
                      name="horaFinTarde"
                      required
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
                  <label>Desde</label>
                  <input
                    type="time"
                    name="horaInicio"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Hasta</label>
                  <input
                    type="time"
                    name="horaFin"
                    required
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