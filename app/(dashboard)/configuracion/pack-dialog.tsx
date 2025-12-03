'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { savePackAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

export function PackDialog({
  isOpen,
  onClose,
  pack,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  pack: Pack | null
  onSuccess?: (pack: Pack, isEdit: boolean) => void
}) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await savePackAPI({
        id: pack?.id,
        nombre: formData.get('nombre') as string,
        clasesPorSemana: parseInt(formData.get('clasesPorSemana') as string),
        precio: parseFloat(formData.get('precio') as string),
        estaActivo: pack ? formData.get('estaActivo') === 'on' : true
      })
      showSuccess(pack ? 'Pack actualizado' : 'Pack creado')
      if (onSuccess && result.pack) {
        onSuccess(result.pack, !!pack)
      } else {
        router.refresh()
      }
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al guardar pack')
      setError(err.message || 'Error al guardar pack')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pack ? 'Editar Pack' : 'Nuevo Pack'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-group">
            <label>Nombre del Pack</label>
            <input
              type="text"
              name="nombre"
              placeholder="Pack Semanal"
              required
              defaultValue={pack?.nombre}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Clases por Semana</label>
            <select
              name="clasesPorSemana"
              required
              defaultValue={pack?.clasesPorSemana}
              disabled={isLoading}
            >
              <option value="">Seleccionar...</option>
              <option value="1">1 clase por semana</option>
              <option value="2">2 clases por semana</option>
              <option value="3">3 clases por semana</option>
              <option value="4">4 clases por semana</option>
              <option value="5">5 clases por semana</option>
            </select>
          </div>

          <div className="form-group">
            <label>Precio (ARS)</label>
            <input
              type="number"
              name="precio"
              placeholder="8000"
              min="0"
              step="0.01"
              required
              defaultValue={pack?.precio}
              disabled={isLoading}
            />
          </div>

          {pack && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="estaActivo"
                  defaultChecked={pack.estaActivo}
                  disabled={isLoading}
                />
                <span>Pack activo</span>
              </label>
            </div>
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
