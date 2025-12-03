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

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

export function AlumnoDialog({
  isOpen,
  onClose,
  alumno,
  onSuccess,
  packs,
  precioPorClase
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  onSuccess?: (alumno: Alumno, isEdit: boolean) => void
  packs: Pack[]
  precioPorClase: string
}) {
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packType, setPackType] = useState<'mensual' | 'por_clase'>(
    alumno?.packType === 'por_clase' ? 'por_clase' : 'mensual'
  )
  const [selectedPackId, setSelectedPackId] = useState<string>(
    // Si el alumno tiene un packType que es un ID de pack, usarlo
    alumno?.packType && alumno.packType !== 'mensual' && alumno.packType !== 'por_clase'
      ? alumno.packType
      : packs[0]?.id || ''
  )
  const [selectedGenero, setSelectedGenero] = useState(alumno?.genero || 'F')

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setPackType('mensual')
      setSelectedPackId(packs[0]?.id || '')
      setSelectedGenero('F')
    } else if (alumno) {
      // Determinar si es por_clase o mensual
      if (alumno.packType === 'por_clase') {
        setPackType('por_clase')
      } else {
        setPackType('mensual')
        // Si el packType es un ID de pack, seleccionarlo
        const packExists = packs.find(p => p.id === alumno.packType)
        if (packExists) {
          setSelectedPackId(alumno.packType)
        } else if (packs.length > 0) {
          setSelectedPackId(packs[0].id)
        }
      }
      setSelectedGenero(alumno.genero || 'F')
    }
  }, [isOpen, alumno, packs])

  // Validaciones
  const precioPorClaseNum = parseFloat(precioPorClase) || 0
  const hayPacks = packs.length > 0
  const hayPrecioPorClase = precioPorClaseNum > 0
  const puedeMensual = hayPacks
  const puedePorClase = hayPrecioPorClase

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Determinar el packType y precio según la selección
    let finalPackType: string
    let finalPrecio: number

    if (packType === 'por_clase') {
      if (!puedePorClase) {
        setError('Configurá el precio por clase en Configuración > Packs y Precios')
        setIsLoading(false)
        return
      }
      finalPackType = 'por_clase'
      finalPrecio = precioPorClaseNum
    } else {
      if (!puedeMensual) {
        setError('Creá al menos un pack en Configuración > Packs y Precios')
        setIsLoading(false)
        return
      }
      // Mensual: usar el ID del pack seleccionado
      finalPackType = selectedPackId
      const selectedPack = packs.find(p => p.id === selectedPackId)
      finalPrecio = selectedPack ? parseFloat(selectedPack.precio) : 0
    }

    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      genero: selectedGenero,
      cumpleanos: formData.get('cumpleanos') as string || undefined,
      patologias: formData.get('patologias') as string || undefined,
      packType: finalPackType,
      precio: finalPrecio,
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
            <label>Tipo de Pago</label>
            {!puedeMensual && !puedePorClase ? (
              <div style={{
                padding: '1rem',
                background: 'rgba(255, 180, 100, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 180, 100, 0.3)'
              }}>
                <p style={{ color: 'rgba(255, 180, 100, 0.9)', fontSize: '0.875rem', margin: 0 }}>
                  No hay opciones de pago configuradas. Creá packs o configurá el precio por clase en <strong>Configuración &gt; Packs y Precios</strong>
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => puedeMensual && setPackType('mensual')}
                  disabled={isLoading || !puedeMensual}
                  className={`pack-option ${packType === 'mensual' ? 'selected' : ''}`}
                  style={{ opacity: puedeMensual ? 1 : 0.5 }}
                >
                  <div className="pack-option-label">Mensual</div>
                  {!puedeMensual && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Sin packs</div>}
                </button>
                <button
                  type="button"
                  onClick={() => puedePorClase && setPackType('por_clase')}
                  disabled={isLoading || !puedePorClase}
                  className={`pack-option ${packType === 'por_clase' ? 'selected' : ''}`}
                  style={{ opacity: puedePorClase ? 1 : 0.5 }}
                >
                  <div className="pack-option-label">Por Clase</div>
                  {!puedePorClase && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Sin precio</div>}
                </button>
              </div>
            )}
          </div>

          {packType === 'mensual' && (
            <div className="form-group">
              <label>Pack Mensual</label>
              {packs.length === 0 ? (
                <p style={{ color: 'rgba(255, 180, 100, 0.9)', fontSize: '0.875rem' }}>
                  No tenés packs configurados. Crealos en Configuracion &gt; Packs y Precios
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {packs.map(pack => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      disabled={isLoading}
                      className={`pack-option ${selectedPackId === pack.id ? 'selected' : ''}`}
                      style={{ textAlign: 'left', padding: '0.75rem 1rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="pack-option-label">{pack.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                            {pack.clasesPorSemana} clase{pack.clasesPorSemana > 1 ? 's' : ''} por semana
                          </div>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'rgba(147, 155, 245, 0.9)' }}>
                          ${parseFloat(pack.precio).toLocaleString('es-AR')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {packType === 'por_clase' && (
            <div className="form-group">
              <label>Precio por Clase</label>
              <div style={{
                padding: '1rem',
                background: 'rgba(147, 155, 245, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(147, 155, 245, 0.3)'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(147, 155, 245, 0.9)' }}>
                  ${parseFloat(precioPorClase).toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                  Precio configurado en ajustes
                </div>
              </div>
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
              disabled={isLoading || (!puedeMensual && !puedePorClase)}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}