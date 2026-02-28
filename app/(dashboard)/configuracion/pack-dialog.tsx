'use client'

import { useState, useEffect } from 'react'
import { savePackAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { DialogBase } from '@/components/ui/dialog-base'
import { SelectInput } from '@/components/select-input'
import type { Pack } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

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
  const { showSuccess } = useToast()
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
        precio: parseFloat(formData.get('precio') as string)
      })
      showSuccess(pack ? 'Pack actualizado' : 'Pack creado')
      if (result.pack) {
        onSuccess?.(result.pack, !!pack)
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err) || 'Error al guardar pack')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={pack ? 'Editar Pack' : 'Nuevo Pack'}
      footer={
        <>
          <button
            type="submit"
            form="pack-form"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            disabled={isLoading}
          >
            Cancelar
          </button>
        </>
      }
    >
      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <form id="pack-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="pack-nombre">Nombre del Pack</label>
          <input
            id="pack-nombre"
            type="text"
            name="nombre"
            placeholder="Pack Semanal"
            required
            defaultValue={pack?.nombre}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pack-clases-por-semana">Clases por Semana</label>
          <SelectInput
            id="pack-clases-por-semana"
            name="clasesPorSemana"
            required
            defaultValue={pack?.clasesPorSemana?.toString()}
            disabled={isLoading}
          >
            <option value="">Seleccionar...</option>
            <option value="1">1 clase por semana</option>
            <option value="2">2 clases por semana</option>
            <option value="3">3 clases por semana</option>
            <option value="4">4 clases por semana</option>
            <option value="5">5 clases por semana</option>
          </SelectInput>
        </div>

        <div className="form-group">
          <label htmlFor="pack-precio">Precio (ARS)</label>
          <input
            id="pack-precio"
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
      </form>
    </DialogBase>
  )
}
