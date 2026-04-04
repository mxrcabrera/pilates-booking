'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { updateBuddyUrls } from '@/app/(dashboard)/configuracion/actions'
import { getErrorMessage } from '@/lib/utils'
import { useSession } from '@/lib/use-session'

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
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Personaje / Mascota de Marca
        </h3>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Configura un personaje animado que saludará a tus clientes. 
          Si subes la imagen de &quot;Saludo&quot;, se usará como base para todo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {UPLOAD_STATES.map((state) => {
          const currentUrl = urls[state.id as keyof typeof urls]
          const isCurrentlyUploading = isUploading === state.id
          
          return (
            <div key={state.id} className="flex flex-col items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{state.label}</div>
              
              <div className="relative group w-24 h-24">
                <div className="w-full h-full rounded-full bg-[rgba(147,155,245,0.1)] flex items-center justify-center overflow-hidden ring-2 ring-background relative">
                  {currentUrl ? (
                    <Image src={currentUrl} alt={state.label} fill className="object-cover" />
                  ) : (
                    <span className="text-xs text-center px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Recomendado</span>
                  )}
                  
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    {isCurrentlyUploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => handleFileChange(e, state.id as 'greeting' | 'celebrate' | 'zen')}
                      disabled={isCurrentlyUploading}
                    />
                  </label>
                </div>
              </div>

              {currentUrl && (
                <button 
                  type="button"
                  className="text-xs flex items-center gap-1 mt-2 hover:underline"
                  style={{ color: 'rgba(255, 100, 100, 0.9)' }}
                  onClick={() => handleDelete(state.id as 'greeting' | 'celebrate' | 'zen')}
                  disabled={isCurrentlyUploading}
                >
                  <Trash2 size={12} /> Quitar
                </button>
              )}
            </div>
          )
        })}
      </div>

      {message && (
        <p className="text-sm font-medium mt-2" style={{ color: message.type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255, 100, 100, 0.9)' }}>
          {message.text}
        </p>
      )}
    </div>
  )
}
