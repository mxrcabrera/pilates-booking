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
import type { Alumno, Pack } from '@/lib/types'

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
  const [consentimientoTutor, setConsentimientoTutor] = useState(alumno?.consentimientoTutor || false)
  const [esMenor, setEsMenor] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setPackType('mensual')
      setSelectedPackId(packs[0]?.id || '')
      setSelectedGenero('F')
      setConsentimientoTutor(false)
      setEsMenor(false)
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

    const cumpleanosStr = formData.get('cumpleanos') as string

    // Validar edad si se proporciona fecha de nacimiento
    if (cumpleanosStr) {
      const cumpleanos = new Date(cumpleanosStr)
      const hoy = new Date()
      const edad = Math.floor((hoy.getTime() - cumpleanos.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

      if (edad < 18 && !consentimientoTutor) {
        setError('Los menores de 18 años requieren consentimiento de padre, madre o tutor')
        setIsLoading(false)
        return
      }
    }

    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      genero: selectedGenero,
      cumpleanos: cumpleanosStr || undefined,
      patologias: formData.get('patologias') as string || undefined,
      packType: finalPackType,
      precio: finalPrecio,
      consentimientoTutor,
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

  // Handler para cambio de fecha de nacimiento
  const handleCumpleanosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaStr = e.target.value
    if (!fechaStr) {
      setEsMenor(false)
      setConsentimientoTutor(false)
      return
    }

    const cumpleanos = new Date(fechaStr)
    const hoy = new Date()
    const edad = Math.floor((hoy.getTime() - cumpleanos.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    setEsMenor(edad < 18)
    if (edad >= 18) {
      setConsentimientoTutor(false)
    }
  }

  // Calcular fecha máxima (hoy menos 1 día)
  const getMaxDate = () => {
    const hoy = new Date()
    hoy.setDate(hoy.getDate() - 1)
    return hoy.toISOString().split('T')[0]
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
                max={getMaxDate()}
                defaultValue={formatDateForInput(alumno?.cumpleanos || null)}
                onChange={handleCumpleanosChange}
                disabled={isLoading}
            />
          </div>

          {esMenor && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={consentimientoTutor}
                  onChange={(e) => setConsentimientoTutor(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Tengo consentimiento de padre, madre o tutor</span>
              </label>
            </div>
          )}

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
            <div className="genero-grid">
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
              <div className="form-warning-box">
                <p className="form-warning-text">
                  No hay opciones de pago configuradas. Creá packs o configurá el precio por clase en <strong>Configuración &gt; Packs y Precios</strong>
                </p>
              </div>
            ) : (
              <div className="tipo-pago-grid">
                <button
                  type="button"
                  onClick={() => puedeMensual && setPackType('mensual')}
                  disabled={isLoading || !puedeMensual}
                  className={`pack-option ${packType === 'mensual' ? 'selected' : ''}`}
                  style={{ opacity: puedeMensual ? 1 : 0.5 }}
                >
                  <div className="pack-option-label">Mensual</div>
                  {!puedeMensual && <div className="pack-option-note">Sin packs</div>}
                </button>
                <button
                  type="button"
                  onClick={() => puedePorClase && setPackType('por_clase')}
                  disabled={isLoading || !puedePorClase}
                  className={`pack-option ${packType === 'por_clase' ? 'selected' : ''}`}
                  style={{ opacity: puedePorClase ? 1 : 0.5 }}
                >
                  <div className="pack-option-label">Por Clase</div>
                  {!puedePorClase && <div className="pack-option-note">Sin precio</div>}
                </button>
              </div>
            )}
          </div>

          {packType === 'mensual' && (
            <div className="form-group">
              <label>Pack Mensual</label>
              {packs.length === 0 ? (
                <p className="form-warning-text">
                  No tenés packs configurados. Crealos en Configuracion &gt; Packs y Precios
                </p>
              ) : (
                <div className="pack-list">
                  {packs.map(pack => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      disabled={isLoading}
                      className={`pack-option pack-option-detailed ${selectedPackId === pack.id ? 'selected' : ''}`}
                    >
                      <div className="pack-option-content">
                        <div className="pack-option-info">
                          <div className="pack-option-label">{pack.nombre}</div>
                          <div className="pack-option-description">
                            {pack.clasesPorSemana} clase{pack.clasesPorSemana > 1 ? 's' : ''} por semana
                          </div>
                        </div>
                        <div className="pack-option-price">
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
              <div className="precio-info-box">
                <div className="precio-info-amount">
                  ${parseFloat(precioPorClase).toLocaleString('es-AR')}
                </div>
                <div className="precio-info-note">
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