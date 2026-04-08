'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { updateBuddyUrls } from '@/app/(dashboard)/configuracion/actions'
import { useSession } from '@/lib/use-session'
import { FormField } from '@/components/ui/form-field'

interface BuddyUploadProps {
  currentGreeting: string | null
  currentCelebrate: string | null
  currentZen: string | null
}

const UPLOAD_STATES = [
  { id: 'greeting', label: 'Saludo (Por Defecto)', key: 'buddyGreetingUrl' },
  { id: 'celebrate', label: 'Celebración', key: 'buddyCelebrateUrl' },
  { id: 'zen', label: 'Modo Zen', key: 'buddyZenUrl' }
] as const

export function BuddyUpload({ currentGreeting, currentCelebrate, currentZen }: BuddyUploadProps) {
  const [urls, setUrls] = useState({
    greeting: currentGreeting,
    celebrate: currentCelebrate,
    zen: currentZen
  })

  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { refresh } = useSession()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, stateId: 'greeting' | 'celebrate' | 'zen') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen excede los 2MB permitidos' })
      return
    }

    setIsUploading(stateId)
    setMessage(null)

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('filenamePrefix', stateId)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir la imagen')

      const publicUrl = json.url

      const payload = {
        buddyGreetingUrl: stateId === 'greeting' ? publicUrl : urls.greeting,
        buddyCelebrateUrl: stateId === 'celebrate' ? publicUrl : urls.celebrate,
        buddyZenUrl: stateId === 'zen' ? publicUrl : urls.zen,
      }

      await updateBuddyUrls(payload)
      setUrls((prev) => ({ ...prev, [stateId]: publicUrl }))
      setMessage({ type: 'success', text: `Imagen de ${stateId} actualizada` })
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Hubo un error subiendo la imagen' })
    } finally {
      setIsUploading(null)
      e.target.value = ''
    }
  }

  const handleDelete = async (stateId: 'greeting' | 'celebrate' | 'zen') => {
    setIsUploading(stateId)
    try {
      const payload = {
        buddyGreetingUrl: stateId === 'greeting' ? null : urls.greeting,
        buddyCelebrateUrl: stateId === 'celebrate' ? null : urls.celebrate,
        buddyZenUrl: stateId === 'zen' ? null : urls.zen,
      }
      await updateBuddyUrls(payload)
      setUrls((prev) => ({ ...prev, [stateId]: null }))
      setMessage({ type: 'success', text: `Imagen de ${stateId} eliminada` })
      await refresh()
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar la imagen' })
    } finally {
      setIsUploading(null)
    }
  }

  return (
    <div className="accordion-form">
      <FormField label="Mascota / Personaje">
        {/* Grid de Mascotas - Refinado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {UPLOAD_STATES.map((state) => {
            const currentUrl = urls[state.id as keyof typeof urls]
            const isCurrentlyUploading = isUploading === state.id

            return (
              <div 
                key={state.id} 
                className="dash-turno-card group flex flex-col h-full"
              >
                {/* Header con Badge-like label */}
                <div className="dash-turno-header w-full border-b border-white/[0.03] pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 group-hover:text-indigo-400 transition-colors">
                    {state.label.split(' ')[0]}
                  </span>
                  {currentUrl && (
                    <button
                      type="button"
                      className="text-white/10 hover:text-red-400 transition-colors p-1"
                      onClick={() => handleDelete(state.id as 'greeting' | 'celebrate' | 'zen')}
                      disabled={isCurrentlyUploading}
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* Preview Arena - High Fidelity Shadow */}
                <div className="relative aspect-square w-full mt-4 rounded-xl border border-white/5 bg-black/10 overflow-hidden transition-all duration-300 group-hover:border-white/10 group-hover:bg-black/20">
                  {currentUrl ? (
                    <Image 
                      src={currentUrl} 
                      alt={state.label} 
                      fill 
                      className="object-contain p-4 transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <Camera size={40} strokeWidth={1} />
                    </div>
                  )}

                  {/* Acceso Directo al subir */}
                  <label className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px] cursor-pointer">
                    {isCurrentlyUploading ? (
                      <Loader2 className="animate-spin text-white/80" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <Camera className="text-white w-6 h-6 drop-shadow-md" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Cambiar</span>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => handleFileChange(e, state.id as 'greeting' | 'celebrate' | 'zen')}
                      disabled={isCurrentlyUploading}
                    />
                  </label>
                </div>

                <div className="mt-auto pt-4 flex justify-start">
                  <div className="accordion-form-actions !mt-0 !pt-0 !border-t-0 bg-transparent">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={(e) => {
                         const input = e.currentTarget.closest('.dash-turno-card')?.querySelector('input[type="file"]') as HTMLInputElement
                         input?.click()
                      }}
                      disabled={isCurrentlyUploading}
                    >
                      {isCurrentlyUploading ? 'Subiendo...' : currentUrl ? 'Reemplazar' : 'Subir Imagen'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </FormField>

      <div className="mt-14 pt-8 border-t border-white/[0.04] text-center">
          <p className="form-hint leading-relaxed max-w-3xl mx-auto">
            Personalizá cómo Welfi interactúa con tus alumnos. <br />
            El estado de <strong className="text-white/60">&quot;Saludo&quot;</strong> es la base maestra; si no subís los otros estados, <br className="hidden md:block" />
            usaremos esa imagen por defecto en el Dashboard y notificaciones.
          </p>
      </div>
      {message && (
        <div className={`mt-6 text-sm font-medium p-3 rounded-lg border w-fit ${
          message.type === 'success' 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
