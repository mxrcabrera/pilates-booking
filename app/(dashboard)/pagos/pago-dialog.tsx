'use client'

import { useState, useEffect } from 'react'
import { createPagoAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { DialogBase } from '@/components/ui/dialog-base'
import { SelectInput } from '@/components/select-input'
import type { Pago, AlumnoPago } from '@/lib/types'
import { MESES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function PagoDialog({
  isOpen,
  onClose,
  alumnos,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  alumnos: AlumnoPago[]
  onSuccess?: (pago: Pago) => void
}) {
  const { showSuccess } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [monto, setMonto] = useState('')
  const [diaVencimiento, setDiaVencimiento] = useState('10')

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Generar array de días del 1 al 28
  const diasDelMes = Array.from({ length: 28 }, (_, i) => i + 1)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSelectedAlumnoId('')
      setMonto('')
      setDiaVencimiento('10')
    }
  }, [isOpen])

  // Actualizar monto y día de vencimiento cuando cambia el alumno
  useEffect(() => {
    if (selectedAlumnoId) {
      const alumno = alumnos.find(a => a.id === selectedAlumnoId)
      if (alumno) {
        // Precargar día de ciclo del alumno
        setDiaVencimiento(alumno.diaInicioCiclo?.toString() || '10')

        // Calcular monto considerando saldo a favor
        const precioBase = parseFloat(alumno.precio) || 0
        const saldo = parseFloat(alumno.saldoAFavor) || 0
        const montoFinal = Math.max(0, precioBase - saldo)
        setMonto(montoFinal.toString())
      }
    }
  }, [selectedAlumnoId, alumnos])

  // Obtener alumno seleccionado para mostrar info
  const alumnoSeleccionado = alumnos.find(a => a.id === selectedAlumnoId)
  const saldoAFavor = alumnoSeleccionado ? parseFloat(alumnoSeleccionado.saldoAFavor) || 0 : 0
  const precioBase = alumnoSeleccionado ? parseFloat(alumnoSeleccionado.precio) || 0 : 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const mesIndex = parseInt(formData.get('mes') as string)
    const anio = parseInt(formData.get('anio') as string)
    const dia = parseInt(diaVencimiento)

    // Fecha de vencimiento con el día seleccionado
    const fechaVencimiento = new Date(anio, mesIndex, dia)

    const mesCorrespondiente = `${anio}-${(mesIndex + 1).toString().padStart(2, '0')}`

    try {
      const result = await createPagoAPI({
        alumnoId: selectedAlumnoId,
        monto: parseFloat(monto),
        fechaVencimiento: fechaVencimiento.toISOString(),
        mesCorrespondiente
      })

      showSuccess('Pago registrado')
      onSuccess?.(result.pago)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err) || 'Error al crear pago')
    } finally {
      setIsLoading(false)
    }
  }

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
        form="pago-form"
        className="btn-primary"
        disabled={isLoading || !selectedAlumnoId}
      >
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Pago"
      footer={footerButtons}
    >
      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}

      <form id="pago-form" onSubmit={handleSubmit} className="dialog-body">
        <div className="form-group">
          <label htmlFor="pago-alumno">Alumno</label>
          <SelectInput
            id="pago-alumno"
            name="alumnoId"
            required
            value={selectedAlumnoId}
            onChange={(e) => setSelectedAlumnoId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Seleccionar alumno...</option>
            {alumnos.map(alumno => (
              <option key={alumno.id} value={alumno.id}>
                {alumno.nombre}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pago-mes">Mes</label>
            <SelectInput id="pago-mes" name="mes" required disabled={isLoading} defaultValue={currentMonth.toString()}>
              {MESES.map((mes, idx) => (
                <option key={mes} value={idx}>{mes}</option>
              ))}
            </SelectInput>
          </div>

          <div className="form-group">
            <label htmlFor="pago-anio">Año</label>
            <SelectInput id="pago-anio" name="anio" required disabled={isLoading} defaultValue={currentYear.toString()}>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </SelectInput>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pago-dia-vencimiento">Día de vencimiento</label>
          <SelectInput
            id="pago-dia-vencimiento"
            name="diaVencimiento"
            required
            value={diaVencimiento}
            onChange={(e) => setDiaVencimiento(e.target.value)}
            disabled={isLoading}
          >
            {diasDelMes.map(dia => (
              <option key={dia} value={dia}>{dia}</option>
            ))}
          </SelectInput>
        </div>

        <div className="form-group">
          <label htmlFor="pago-monto">Monto (ARS)</label>
          <input
            id="pago-monto"
            type="number"
            name="monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="10000"
            min="0"
            step="0.01"
            required
            disabled={isLoading}
          />
          {saldoAFavor !== 0 && alumnoSeleccionado && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: saldoAFavor > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              {saldoAFavor > 0 ? (
                <>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Pack ${precioBase.toLocaleString('es-AR')} - Saldo ${saldoAFavor.toLocaleString('es-AR')} = <strong style={{ color: '#10b981' }}>${parseFloat(monto).toLocaleString('es-AR')}</strong>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem' }}>
                    Saldo a favor aplicado
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Pack ${precioBase.toLocaleString('es-AR')} + Debe ${Math.abs(saldoAFavor).toLocaleString('es-AR')} = <strong style={{ color: '#ef4444' }}>${parseFloat(monto).toLocaleString('es-AR')}</strong>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem' }}>
                    Deuda de ciclo anterior
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </form>
    </DialogBase>
  )
}
