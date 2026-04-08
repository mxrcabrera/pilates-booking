'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { updateAvatar } from '@/app/(dashboard)/configuracion/actions'
import { getErrorMessage } from '@/lib/utils'
import { FormField } from '@/components/ui/form-field'

interface AvatarUploadProps {
  currentAvatar: string | null
  userName: string
}

export function AvatarUpload({ currentAvatar, userName }: AvatarUploadProps) {
  const [avatar, setAvatar] = useState(currentAvatar)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen excede los 2MB permitidos' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('filenamePrefix', 'avatar')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir la imagen')

      const publicUrl = json.url

      await updateAvatar(publicUrl)
      setAvatar(publicUrl)
      setMessage({ type: 'success', text: 'Avatar actualizado' })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) || 'Hubo un error subiendo la imagen' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    setIsUploading(true)
    try {
      await updateAvatar(null)
      setAvatar(null)
      setMessage({ type: 'success', text: 'Avatar eliminado' })
    } catch {
      setMessage({ type: 'error', text: 'Hubo un error eliminando la imagen' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="accordion-form">
      <FormField label="Foto de Perfil">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">

          {/* Columna 1: El Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="h-24 w-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-3xl font-serif text-indigo-400/90 overflow-hidden relative shadow-lg">
              {avatar ? (
                <Image src={avatar} alt="Avatar" fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}

              <button
                type="button"
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Columna 2: Info */}
          <div className="flex-grow max-w-xs">
            <p className="form-hint !mt-0 leading-relaxed">
              Subí una foto nítida para que tus alumnos puedan reconocerte fácilmente. <br />
              <span className="text-[11px] opacity-60">Formatos: JPG, PNG o WebP (Máx 2MB).</span>
            </p>
          </div>

          {/* Columna 3: Botones (Alineados con el estilo Guardar Cambios) */}
          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            
            <div className="accordion-form-actions !mt-0 !pt-0 !border-t-0 bg-transparent">
              <button
                type="button"
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
              </button>
            </div>

            {avatar && (
              <button
                type="button"
                className="text-xs font-medium text-red-400/30 hover:text-red-400 transition-colors py-1"
                onClick={handleDelete}
                disabled={isUploading}
              >
                Eliminar foto
              </button>
            )}
          </div>
        </div>
      </FormField>

      {message && (
        <div className={`mt-6 text-sm font-medium p-3 rounded-lg border w-fit ${message.type === 'success'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
