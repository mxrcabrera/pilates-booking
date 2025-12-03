'use client'

import { useState, useEffect } from 'react'
import { createAlumnoAPI, updateAlumnoAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  genero: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
  _count: {
    clases: number
    pagos: number
  }
}

const PACK_TYPES = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'por_clase', label: 'Por Clase' },
]

export function AlumnoDialog({
  isOpen,
  onClose,
  alumno,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  onSuccess?: (alumno: Alumno, isEdit: boolean) => void
}) {
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState(alumno?.packType || 'mensual')

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSelectedPack('mensual')
    } else if (alumno) {
      setSelectedPack(alumno.packType)
    }
  }, [isOpen, alumno])

  const [selectedGenero, setSelectedGenero] = useState(alumno?.genero || 'F')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const packType = formData.get('packType') as string

    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      genero: selectedGenero,
      cumpleanos: formData.get('cumpleanos') as string || undefined,
      patologias: formData.get('patologias') as string || undefined,
      packType,
      precio: 0,
    }

    try {
      if (alumno) {
        const result = await updateAlumnoAPI({ id: alumno.id, ...data })
        showSuccess('Alumno actualizado')
        onSuccess?.(result.alumno, true)
      } else {
        const result = await createAlumnoAPI(data)
        showSuccess('Alumno creado')
        onSuccess?.(result.alumno, false)
      }
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al guardar alumno')
      setError(err.message || 'Error al guardar alumno')
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{alumno ? 'Editar Alumno' : 'Nuevo Alumno'}</DialogTitle>
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
              defaultValue={alumno?.nombre}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="maria@email.com"
              required
              defaultValue={alumno?.email}
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
              defaultValue={alumno?.telefono}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Cumpleaños</label>
            <input
                type="date"
                name="cumpleanos"
                defaultValue={formatDateForInput(alumno?.cumpleanos || null)}
                disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Patologías / Observaciones</label>
            <textarea
                name="patologias"
                placeholder="Lesiones, condiciones médicas, limitaciones físicas..."
                rows={3}
                defaultValue={alumno?.patologias || ''}
                disabled={isLoading}
                className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label>Género</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedGenero('F')}
                disabled={isLoading}
                className={`pack-option ${selectedGenero === 'F' ? 'selected' : ''}`}
              >
                <div className="pack-option-label">Mujer</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGenero('M')}
                disabled={isLoading}
                className={`pack-option ${selectedGenero === 'M' ? 'selected' : ''}`}
              >
                <div className="pack-option-label">Hombre</div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Tipo de Pack</label>
            <input type="hidden" name="packType" value={selectedPack} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {PACK_TYPES.map(pack => (
                <button
                  key={pack.value}
                  type="button"
                  onClick={() => setSelectedPack(pack.value)}
                  disabled={isLoading}
                  className={`pack-option ${selectedPack === pack.value ? 'selected' : ''}`}
                >
                  <div className="pack-option-label">{pack.label}</div>
                </button>
              ))}
            </div>
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