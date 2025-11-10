'use client'

import { useState, useEffect } from 'react'
import { saveHorario } from './actions'
import { ConfirmDialog } from './confirm-dialog'
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
  { value: 'maniana', label: 'Mañana', emoji: '🌅' },
  { value: 'tarde', label: 'Tarde', emoji: '🌆' },
  { value: 'ambos', label: 'Mañana y Tarde', emoji: '☀️' },
]

export function HorarioDialog({
  isOpen,
  onClose,
  horario
}: {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rangoSeleccionado, setRangoSeleccionado] = useState('single')
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('maniana')
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null)
  const [confirmType, setConfirmType] = useState<'sabado-tarde' | 'domingo' | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setRangoSeleccionado('single')
      setTurnoSeleccionado('maniana')
      setPendingSubmit(null)
      setConfirmType(null)
    }
  }, [isOpen])

  async function procesarHorarios(formData: FormData, excluirSabadoTarde: boolean = false, excluirDomingo: boolean = false) {
    const rango = RANGOS_DIAS.find(r => r.value === rangoSeleccionado)
    
    if (rango && rango.dias.length > 0) {
      for (const dia of rango.dias) {
        if (excluirSabadoTarde && dia === 6 && (turnoSeleccionado === 'tarde' || turnoSeleccionado === 'ambos')) {
          if (turnoSeleccionado === 'tarde') continue
          const fdManiana = new FormData()
          fdManiana.append('diaSemana', dia.toString())
          fdManiana.append('horaInicio', formData.get('horaInicioManiana') as string)
          fdManiana.append('horaFin', formData.get('horaFinManiana') as string)
          fdManiana.append('esManiana', 'true')
          await saveHorario(fdManiana)
          continue
        }

        if (excluirDomingo && dia === 0) continue

        if (turnoSeleccionado === 'ambos') {
          const fdManiana = new FormData()
          fdManiana.append('diaSemana', dia.toString())
          fdManiana.append('horaInicio', formData.get('horaInicioManiana') as string)
          fdManiana.append('horaFin', formData.get('horaFinManiana') as string)
          fdManiana.append('esManiana', 'true')
          await saveHorario(fdManiana)
          
          const fdTarde = new FormData()
          fdTarde.append('diaSemana', dia.toString())
          fdTarde.append('horaInicio', formData.get('horaInicioTarde') as string)
          fdTarde.append('horaFin', formData.get('horaFinTarde') as string)
          fdTarde.append('esManiana', 'false')
          await saveHorario(fdTarde)
        } else {
          const fd = new FormData()
          fd.append('diaSemana', dia.toString())
          fd.append('horaInicio', formData.get('horaInicio') as string)
          fd.append('horaFin', formData.get('horaFin') as string)
          fd.append('esManiana', (turnoSeleccionado === 'maniana').toString())
          await saveHorario(fd)
        }
      }
    } else {
      if (turnoSeleccionado === 'ambos') {
        const diaSemana = formData.get('diaSemana') as string
        
        const fdManiana = new FormData()
        fdManiana.append('diaSemana', diaSemana)
        fdManiana.append('horaInicio', formData.get('horaInicioManiana') as string)
        fdManiana.append('horaFin', formData.get('horaFinManiana') as string)
        fdManiana.append('esManiana', 'true')
        await saveHorario(fdManiana)
        
        const fdTarde = new FormData()
        fdTarde.append('diaSemana', diaSemana)
        fdTarde.append('horaInicio', formData.get('horaInicioTarde') as string)
        fdTarde.append('horaFin', formData.get('horaFinTarde') as string)
        fdTarde.append('esManiana', 'false')
        await saveHorario(fdTarde)
      } else {
        await saveHorario(formData)
      }
    }
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
        formData.append('id', horario.id)
        await saveHorario(formData)
      } else {
        await procesarHorarios(formData)
      }
      onClose()
    } catch (err: any) {
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
      if (confirmType === 'sabado-tarde') {
        await procesarHorarios(pendingSubmit, option === 'excluir')
      } else if (confirmType === 'domingo') {
        await procesarHorarios(pendingSubmit, false, option === 'excluir')
      }
      onClose()
    } catch (err: any) {
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
                        defaultChecked={horario.esManiana}
                      />
                      <span>🌅 Mañana</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="esManiana"
                        value="false"
                        defaultChecked={!horario.esManiana}
                      />
                      <span>🌆 Tarde</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {turnoSeleccionado === 'ambos' && !horario && (
              <>
                <div className="form-group">
                  <label>🌅 Horario Mañana</label>
                  <div className="form-row">
                    <input
                      type="time"
                      name="horaInicioManiana"
                      required
                      defaultValue="09:00"
                      disabled={isLoading}
                    />
                    <input
                      type="time"
                      name="horaFinManiana"
                      required
                      defaultValue="13:00"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>🌆 Horario Tarde</label>
                  <div className="form-row">
                    <input
                      type="time"
                      name="horaInicioTarde"
                      required
                      defaultValue="15:00"
                      disabled={isLoading}
                    />
                    <input
                      type="time"
                      name="horaFinTarde"
                      required
                      defaultValue="19:00"
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
                    defaultValue={horario?.horaInicio || '09:00'}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Hasta</label>
                  <input
                    type="time"
                    name="horaFin"
                    required
                    defaultValue={horario?.horaFin || '18:00'}
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