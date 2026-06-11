'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2, Plus, Star } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import {
  MASCOT_APP_CONTEXTS,
  MASCOT_SCREEN_CONTEXTS,
  DEFAULT_MASCOT_RULES,
  type MascotImage,
  type MascotRule,
} from '@/lib/mascot'
import { updateBuddyName,
  addMascotImage,
  updateMascotImage,
  deleteMascotImage,
  saveMascotRules,
} from '@/app/(dashboard)/configuracion/mascot-actions'
import { useMascot } from '@/lib/mascot-context'
import { SelectInput } from '@/components/select-input'

type MascotConfigProps = {
  initialName: string
  initialImages: MascotImage[]
  initialRules: MascotRule[]
}

type RuleDraft = { context: string; tag: string; priority: number }

const ALL_CONTEXTS = [
  ...MASCOT_SCREEN_CONTEXTS.map((c) => ({ id: c.id, label: `📍 ${c.label}` })),
  ...MASCOT_APP_CONTEXTS.map((c) => ({ id: c.id, label: `⏰ ${c.label}` })),
]

export function MascotConfig({ initialName, initialImages, initialRules }: MascotConfigProps) {
  const { refresh } = useMascot()
  const [name, setName] = useState(initialName)
  const [images, setImages] = useState(initialImages)
  const [rules, setRules] = useState<RuleDraft[]>(
    initialRules.length > 0
      ? initialRules.map((r) => ({ context: r.context, tag: r.tag, priority: r.priority }))
      : DEFAULT_MASCOT_RULES.map((r) => ({ ...r }))
  )
  const [uploading, setUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingLabel, setPendingLabel] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const existingTags = [...new Set(images.map((img) => img.label))]

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await updateBuddyName(name)
      await saveMascotRules(rules.filter((r) => r.tag.trim()))
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      setTimeout(() => setMessage(null), 3000)
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar configuración' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const label = pendingLabel.trim()
    if (!label) {
      setMessage({ type: 'error', text: 'Escribí una etiqueta antes de subir' })
      e.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen excede los 2MB' })
      e.target.value = ''
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filenamePrefix', label)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const created = await addMascotImage(json.url, label)
      setImages((prev) => [...prev, created])
      setPendingLabel('')
      setMessage({ type: 'success', text: `Imagen "${label}" subida` })
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Error al subir imagen' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await updateMascotImage(id, { isDefault: true })
      setImages((prev) => prev.map((img) => ({ ...img, isDefault: img.id === id })))
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Error al marcar default' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMascotImage(id)
      setImages((prev) => prev.filter((img) => img.id !== id))
      setMessage({ type: 'success', text: 'Imagen eliminada' })
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar' })
    }
  }

  const addRule = () => {
    setRules((prev) => [...prev, { context: 'default', tag: '', priority: 50 }])
  }

  const updateRule = (index: number, field: keyof RuleDraft, value: string | number) => {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="accordion-form">
      {message && (
        <div className={`form-message ${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="flex flex-col gap-6">
        {/* Sección 1: Nombre de la Mascota */}
        <div className="section-content">
          <div className="horarios-header" style={{ marginBottom: '0.875rem' }}>
            <h2 className="horarios-header-title">Nombre de la Mascota</h2>
          </div>
          <FormField label="">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Welfi"
              className="form-input flex-1"
            />
          </FormField>
        </div>

        {/* Sección 2: Galería de Imágenes */}
        <div className="section-content" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="horarios-header" style={{ marginBottom: '0.75rem' }}>
            <h2 className="horarios-header-title">Galería de Imágenes</h2>
          </div>
          <FormField
            label=""
            hint="Subí cada pose con una etiqueta libre. Si hay 2+ imágenes con la misma etiqueta, la app las alterna con crossfade."
          >
            <div className="flex flex-col gap-4">
              {/* Subdivisión: Subir nueva imagen */}
              <h3>Subir nueva imagen</h3>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  placeholder="Etiqueta para la próxima imagen"
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  className="btn-primary glassy-dark-button"
                  onClick={() => document.getElementById('mascot-image-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  <span>{uploading ? 'Subiendo...' : 'Subir'}</span>
                </button>
                <input
                  id="mascot-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </div>

              {/* Subdivisión: Imágenes existentes */}
              {images.length > 0 && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3>Imágenes existentes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="dash-turno-card flex flex-col">
                        <div className="relative aspect-square rounded-xl border border-white/5 bg-black/10 overflow-hidden">
                          <Image src={img.url} alt={img.label} fill className="object-contain p-3" />
                          {img.isDefault && (
                            <span className="absolute top-2 left-2 status-badge active !text-[10px] !px-2 !py-0.5">
                              default
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm text-white/70 truncate">{img.label}</span>
                          <div className="flex gap-1">
                            {!img.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(img.id)}
                                className="text-white/30 hover:text-amber-400 p-1"
                              >
                                <Star size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              className="text-white/30 hover:text-red-400 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Sección 3: Reglas de aparición */}
        <div className="section-content" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="horarios-header" style={{ marginBottom: '0.75rem' }}>
            <h2 className="horarios-header-title">Reglas de aparición</h2>
            <button 
              type="button" 
              onClick={addRule} 
              className="btn-primary glassy-dark-button"
            >
              <Plus size={16} />
              <span>Nuevo</span>
            </button>
          </div>
          <FormField 
            label=""
            hint={<>Las reglas de <strong>pantalla</strong> tienen prioridad. Después se evalúan las de <strong>contexto</strong> (finde, sin clases, etc.).</>}
          >
            <div className="flex flex-col gap-4">
              {rules.map((rule, index) => (
                <div key={index} className="flex flex-row gap-3 items-center">
                  <SelectInput
                    value={rule.context}
                    onChange={(e) => updateRule(index, 'context', e.target.value)}
                    className="flex-1"
                  >
                    {ALL_CONTEXTS.map((ctx) => (
                      <option key={ctx.id} value={ctx.id}>{ctx.label}</option>
                    ))}
                  </SelectInput>
                  <span className="text-white/30 shrink-0">→</span>
                  <SelectInput
                    value={rule.tag}
                    onChange={(e) => updateRule(index, 'tag', e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Seleccionar etiqueta...</option>
                    {existingTags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-white/30 hover:text-red-400 p-2 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </FormField>
        </div>

        <div className="accordion-form-actions !mt-4">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
