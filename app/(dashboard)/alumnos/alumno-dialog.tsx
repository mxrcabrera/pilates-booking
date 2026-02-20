'use client'

import { useState, useEffect } from 'react'
import { createAlumnoAPI, updateAlumnoAPI, editSeriesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/utils'
import { DialogBase } from '@/components/ui/dialog-base'
import { DateInput } from '@/components/date-input'
import { SelectInput } from '@/components/select-input'
import { Lock } from 'lucide-react'
import type { Alumno, Pack } from '@/lib/types'

type DialogStep = 'form' | 'seriesPrompt'

type SeriesData = {
  activeSeries: Array<{ serieId: string; horaInicio: string }>
  newClasesPorSemana: number
}

const DIAS_SEMANA_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

export function AlumnoDialog({
  isOpen,
  onClose,
  alumno,
  onSuccess,
  packs,
  precioPorClase,
  canUseProrrateo = true,
  currentPlan: _currentPlan = 'STARTER'
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  onSuccess?: (alumno: Alumno, isEdit: boolean) => void
  packs: Pack[]
  precioPorClase: string
  canUseProrrateo?: boolean
  currentPlan?: string
}) {
  const { showSuccess, showError: showErrorToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<DialogStep>('form')
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null)
  const [seriesDias, setSeriesDias] = useState<number[]>([])
  const [isUpdatingSeries, setIsUpdatingSeries] = useState(false)
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
  const [diaInicioCiclo, setDiaInicioCiclo] = useState(alumno?.diaInicioCiclo?.toString() || '1')

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setPackType('mensual')
      setSelectedPackId(packs[0]?.id || '')
      setSelectedGenero('F')
      setConsentimientoTutor(false)
      setEsMenor(false)
      setDiaInicioCiclo('1')
      setStep('form')
      setSeriesData(null)
      setSeriesDias([])
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
      setDiaInicioCiclo(alumno.diaInicioCiclo?.toString() || '1')
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
      diaInicioCiclo: packType === 'mensual' ? parseInt(diaInicioCiclo) : undefined,
    }

    try {
      if (alumno) {
        const result = await updateAlumnoAPI({ id: alumno.id, ...data })
        showSuccess('Alumno actualizado')
        onSuccess?.(result.alumno, true)

        // Check if pack change requires series update
        if (result.activeSeries?.length > 0 && result.newClasesPorSemana) {
          setSeriesData({
            activeSeries: result.activeSeries,
            newClasesPorSemana: result.newClasesPorSemana
          })
          setSeriesDias([])
          setStep('seriesPrompt')
          setIsLoading(false)
          return
        }
      } else {
        const result = await createAlumnoAPI(data)
        showSuccess('Alumno creado')
        onSuccess?.(result.alumno, false)
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
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

  const handleSeriesDiaToggle = (dia: number) => {
    setSeriesDias(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  const handleSkipSeries = () => {
    setStep('form')
    setSeriesData(null)
    onClose()
  }

  const handleUpdateSeries = async () => {
    if (!seriesData) return
    setIsUpdatingSeries(true)
    try {
      await Promise.all(
        seriesData.activeSeries.map(s =>
          editSeriesAPI({
            serieId: s.serieId,
            diasSemana: seriesDias,
            horaInicio: s.horaInicio,
            scope: 'future'
          })
        )
      )
      showSuccess('Clases futuras actualizadas')
      setStep('form')
      setSeriesData(null)
      onClose()
    } catch (err) {
      showErrorToast(getErrorMessage(err))
    } finally {
      setIsUpdatingSeries(false)
    }
  }

  if (step === 'seriesPrompt' && seriesData) {
    return (
      <DialogBase
        isOpen={isOpen}
        onClose={handleSkipSeries}
        title="Actualizar clases"
        footer={
          <>
            <button onClick={handleSkipSeries} className="btn-ghost" disabled={isUpdatingSeries}>
              No, dejar como estan
            </button>
            <button
              onClick={handleUpdateSeries}
              className="btn-primary"
              disabled={seriesDias.length !== seriesData.newClasesPorSemana || isUpdatingSeries}
            >
              {isUpdatingSeries ? 'Actualizando...' : 'Actualizar clases'}
            </button>
          </>
        }
      >
        <div className="serie-update-prompt">
          <p className="serie-update-text">
            El pack cambio a <strong>{seriesData.newClasesPorSemana}x por semana</strong>.
            Selecciona los nuevos dias de clase para actualizar las clases futuras.
          </p>

          <div className="form-group">
            <label>
              Dias de clase ({seriesDias.length}/{seriesData.newClasesPorSemana})
            </label>
            <div className="dias-grid compact">
              {DIAS_SEMANA_OPTIONS.map(dia => (
                <label key={dia.value} className="dia-option" htmlFor={`series-dia-${dia.value}`}>
                  <input
                    type="checkbox"
                    id={`series-dia-${dia.value}`}
                    checked={seriesDias.includes(dia.value)}
                    onChange={() => handleSeriesDiaToggle(dia.value)}
                    disabled={isUpdatingSeries || (!seriesDias.includes(dia.value) && seriesDias.length >= seriesData.newClasesPorSemana)}
                  />
                  <span>{dia.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </DialogBase>
    )
  }

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={alumno ? 'Editar Alumno' : 'Nuevo Alumno'}
      size="lg"
      footer={
        <>
          <button
            type="submit"
            form="alumno-form"
            className="btn-primary"
            disabled={isLoading || (!puedeMensual && !puedePorClase)}
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
        <div className="form-message error">
          {error}
        </div>
      )}

      <form id="alumno-form" onSubmit={handleSubmit}>
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
          <DateInput
            name="cumpleanos"
            max={getMaxDate()}
            defaultValue={formatDateForInput(alumno?.cumpleanos || null)}
            onChange={handleCumpleanosChange}
            disabled={isLoading}
            required={false}
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
          <>
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

            <div className="form-group">
              <label className={!canUseProrrateo ? 'label-with-lock' : ''}>
                Día de inicio de ciclo
                {!canUseProrrateo && <Lock size={14} className="label-lock-icon" />}
              </label>
              {canUseProrrateo ? (
                <>
                  <SelectInput
                    value={diaInicioCiclo}
                    onChange={(e) => setDiaInicioCiclo(e.target.value)}
                    disabled={isLoading}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </SelectInput>
                  <small style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', display: 'block' }}>
                    Día del mes en que comienza el ciclo de facturación
                  </small>
                </>
              ) : (
                <>
                  <div className="locked-field">
                    <span>Día 1 (fijo)</span>
                  </div>
                  <p className="feature-locked-hint">
                    Los ciclos personalizados están disponibles desde el plan {PLAN_NAMES['STARTER']}
                  </p>
                </>
              )}
            </div>
          </>
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
      </form>
    </DialogBase>
  )
}
