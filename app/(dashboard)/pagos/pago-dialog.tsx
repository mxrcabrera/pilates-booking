'use client'

import { useState, useEffect } from 'react'
import { createPagoAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Pago, AlumnoPago } from '@/lib/types'
import { MESES } from '@/lib/constants'

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

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSelectedAlumnoId('')
      setMonto('')
    }
  }, [isOpen])

  // Actualizar monto cuando cambia el alumno
  useEffect(() => {
    if (selectedAlumnoId) {
      const alumno = alumnos.find(a => a.id === selectedAlumnoId)
      if (alumno) {
        setMonto(alumno.precio)
      }
    }
  }, [selectedAlumnoId, alumnos])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const mesIndex = parseInt(formData.get('mes') as string)
    const anio = parseInt(formData.get('anio') as string)

    // Fecha de vencimiento: dia 10 del mes
    const fechaVencimiento = new Date(anio, mesIndex, 10)

    const mesCorrespondiente = `${MESES[mesIndex]} ${anio}`

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
    } catch (err: any) {
      setError(err.message || 'Error al crear pago')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Pago</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-group">
            <label>Alumno</label>
            <select
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
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mes</label>
              <select name="mes" required disabled={isLoading} defaultValue={currentMonth}>
                {MESES.map((mes, idx) => (
                  <option key={mes} value={idx}>{mes}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Anio</label>
              <select name="anio" required disabled={isLoading} defaultValue={currentYear}>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear + 1}>{currentYear + 1}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Monto (ARS)</label>
            <input
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
          </div>

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
              disabled={isLoading || !selectedAlumnoId}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
