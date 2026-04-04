'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { updateAvatar } from '@/app/(dashboard)/configuracion/actions'
import { getErrorMessage } from '@/lib/utils'

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
    <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:items-start md:gap-6">
      <div className="relative group">
        <div className="h-24 w-24 rounded-full bg-[rgba(147,155,245,0.2)] text-[rgba(147,155,245,0.9)] flex items-center justify-center text-3xl font-medium overflow-hidden ring-4 ring-background shadow-lg relative">
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
          
          {/* Upload overlay */}
          <button 
            type="button"
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-center md:text-left">
        <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Foto de perfil</h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Hacé clic en la imagen para subir una nueva foto (JPG o PNG, max 2MB).</p>
        
        <div className="flex gap-4 justify-center md:justify-start mt-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
          />
          <button 
            type="button" 
            className="text-sm rounded-md px-3 py-1.5"
            style={{ backgroundColor: 'rgba(147, 155, 245, 0.1)', color: 'rgba(147, 155, 245, 1)', border: '1px solid rgba(147, 155, 245, 0.2)' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Cambiar avatar'}
          </button>
          
          {avatar && (
            <button 
              type="button"
              className="text-sm rounded-md px-3 py-1.5 flex items-center gap-1"
              style={{ color: 'rgba(255, 100, 100, 0.9)', border: '1px solid rgba(255, 100, 100, 0.2)' }}
              onClick={handleDelete}
              disabled={isUploading}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
        
        {message && (
          <p className="text-sm mt-2 font-medium" style={{ color: message.type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255, 100, 100, 0.9)' }}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
