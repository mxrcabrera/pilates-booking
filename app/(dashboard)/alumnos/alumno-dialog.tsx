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

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

const PACK_TYPES = [
  { value: 'mensual', label: 'Mensual', requiresClases: true },
  { value: 'por_clase', label: 'Por Clase', requiresClases: false },
]

export function AlumnoDialog({
  isOpen,
  onClose,
  alumno,
  packs,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  packs: Pack[]
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

  const packConfig = PACK_TYPES.find(p => p.value === selectedPack)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const packType = formData.get('packType') as string

    // Obtener precio del pack seleccionado si es un pack personalizado
    let precio = 0
    if (packType.startsWith('pack_')) {
      const packId = packType.replace('pack_', '')
      const pack = packs.find(p => p.id === packId)
      if (pack) {
        precio = parseFloat(pack.precio)
      }
    }

    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      cumpleanos: formData.get('cumpleanos') as string || undefined,
      patologias: formData.get('patologias') as string || undefined,
      packType,
      clasesPorMes: formData.get('clasesPorMes') ? parseInt(formData.get('clasesPorMes') as string) : undefined,
      precio,
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
            <label>Tipo de Pack</label>
            <input type="hidden" name="packType" value={selectedPack} required />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Tipos Básicos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
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

              {/* Packs Personalizados */}
              {packs.length > 0 && (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '0.5rem'
                  }}>
                    Packs Personalizados
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {packs.map(pack => (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => setSelectedPack(`pack_${pack.id}`)}
                        disabled={isLoading}
                        className={`pack-option ${selectedPack === `pack_${pack.id}` ? 'selected' : ''}`}
                      >
                        <div className="pack-option-label">{pack.nombre}</div>
                        <div className="pack-option-details">
                          {pack.clasesPorSemana} {pack.clasesPorSemana === 1 ? 'clase' : 'clases'}/sem
                        </div>
                        <div className="pack-option-price">
                          ${parseFloat(pack.precio).toLocaleString('es-AR')}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
                defaultValue={alumno?.clasesPorMes || ''}
                disabled={isLoading}
              />
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