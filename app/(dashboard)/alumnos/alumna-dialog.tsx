'use client'

import { useState, useEffect } from 'react'
import { createAlumna, updateAlumna } from './actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Alumna = {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
}

const PACK_TYPES = [
  { value: 'mensual', label: 'Mensual', requiresClases: true },
  { value: 'por_clase', label: 'Por Clase', requiresClases: false },
  { value: 'pack_4', label: 'Pack 4 Clases', requiresClases: false },
  { value: 'pack_8', label: 'Pack 8 Clases', requiresClases: false },
  { value: 'pack_12', label: 'Pack 12 Clases', requiresClases: false },
]

export function AlumnaDialog({
  isOpen,
  onClose,
  alumna
}: {
  isOpen: boolean
  onClose: () => void
  alumna: Alumna | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState(alumna?.packType || 'mensual')

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSelectedPack('mensual')
    } else if (alumna) {
      setSelectedPack(alumna.packType)
    }
  }, [isOpen, alumna])

  const packConfig = PACK_TYPES.find(p => p.value === selectedPack)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (alumna) {
        formData.append('id', alumna.id)
        await updateAlumna(formData)
      } else {
        await createAlumna(formData)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar alumna')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper para formatear fecha a YYYY-MM-DD
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return dateString.split('T')[0]
}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{alumna ? 'Editar Alumna' : 'Nueva Alumna'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              placeholder="María García"
              required
              defaultValue={alumna?.nombre}
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="maria@email.com"
                required
                defaultValue={alumna?.email}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                placeholder="+54 9 11 1234-5678"
                required
                defaultValue={alumna?.telefono}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cumpleaños</label>
            <input
                type="date"
                name="cumpleanos"
                defaultValue={formatDateForInput(alumna?.cumpleanos || null)}
                disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Patologías / Observaciones</label>
            <textarea
                name="patologias"
                placeholder="Lesiones, condiciones médicas, limitaciones físicas..."
                rows={3}
                defaultValue={alumna?.patologias || ''}
                disabled={isLoading}
                className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Pack</label>
            <select
              name="packType"
              required
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              disabled={isLoading}
            >
              {PACK_TYPES.map(pack => (
                <option key={pack.value} value={pack.value}>
                  {pack.label}
                </option>
              ))}
            </select>
          </div>

          {packConfig?.requiresClases && (
            <div className="form-group">
              <label>Clases por Mes</label>
              <input
                type="number"
                name="clasesPorMes"
                placeholder="8"
                min="1"
                max="31"
                required
                defaultValue={alumna?.clasesPorMes || ''}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label>Precio (ARS)</label>
            <input
              type="number"
              name="precio"
              placeholder="5000"
              min="0"
              step="0.01"
              required
              defaultValue={alumna?.precio?.toString() || ''}
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