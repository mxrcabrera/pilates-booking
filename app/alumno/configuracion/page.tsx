'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, User, Phone, Calendar, FileText, AlertCircle } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

type FormErrors = {
  nombre?: string
  telefono?: string
  genero?: string
}

export default function AlumnoConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    genero: 'F',
    cumpleanos: '',
    patologias: ''
  })

  useEffect(() => {
    fetch('/api/v1/alumno/perfil')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setForm({
            nombre: data.user.nombre || '',
            telefono: data.user.telefono || '',
            genero: data.user.genero || 'F',
            cumpleanos: data.user.cumpleanos || '',
            patologias: data.user.patologias || ''
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load profile:', err)
        setFetchError(true)
        setLoading(false)
      })
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar nombre
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (form.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (form.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre es demasiado largo'
    }

    // Validar teléfono
    if (!form.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (form.telefono.replace(/\D/g, '').length < 8) {
      newErrors.telefono = 'El teléfono debe tener al menos 8 dígitos'
    } else if (form.telefono.replace(/\D/g, '').length > 15) {
      newErrors.telefono = 'El teléfono es demasiado largo'
    }

    // Validar género
    if (!['F', 'M'].includes(form.genero)) {
      newErrors.genero = 'Seleccioná un género'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Corregí los errores del formulario' })
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/v1/alumno/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
        setTimeout(() => router.push('/alumno'), 1500)
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoading />

  if (fetchError) return (
    <div className="page-container">
      <div className="content-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-error, #ef4444)' }} />
        <p>No se pudo cargar tu perfil. Intenta recargar la página.</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mi Perfil</h1>
          <p>Completá tus datos personales</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.text}
        </div>
      )}

      <div className="content-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className={`form-field ${errors.nombre ? 'has-error' : ''}`}>
            <label htmlFor="nombre">
              <User size={16} />
              Nombre completo <span className="required">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              value={form.nombre}
              onChange={e => {
                setForm(f => ({ ...f, nombre: e.target.value }))
                if (errors.nombre) setErrors(e => ({ ...e, nombre: undefined }))
              }}
              className={errors.nombre ? 'input-error' : ''}
            />
            {errors.nombre && (
              <span className="field-error">
                <AlertCircle size={14} />
                {errors.nombre}
              </span>
            )}
          </div>

          <div className={`form-field ${errors.telefono ? 'has-error' : ''}`}>
            <label htmlFor="telefono">
              <Phone size={16} />
              Teléfono <span className="required">*</span>
            </label>
            <input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={e => {
                setForm(f => ({ ...f, telefono: e.target.value }))
                if (errors.telefono) setErrors(e => ({ ...e, telefono: undefined }))
              }}
              placeholder="11 1234-5678"
              className={errors.telefono ? 'input-error' : ''}
            />
            {errors.telefono && (
              <span className="field-error">
                <AlertCircle size={14} />
                {errors.telefono}
              </span>
            )}
          </div>

          <div className={`form-field ${errors.genero ? 'has-error' : ''}`}>
            <label htmlFor="genero">Género <span className="required">*</span></label>
            <div className="radio-group">
              <label className={`radio-option ${form.genero === 'F' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genero"
                  value="F"
                  checked={form.genero === 'F'}
                  onChange={e => {
                    setForm(f => ({ ...f, genero: e.target.value }))
                    if (errors.genero) setErrors(e => ({ ...e, genero: undefined }))
                  }}
                />
                <span>Femenino</span>
              </label>
              <label className={`radio-option ${form.genero === 'M' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genero"
                  value="M"
                  checked={form.genero === 'M'}
                  onChange={e => {
                    setForm(f => ({ ...f, genero: e.target.value }))
                    if (errors.genero) setErrors(e => ({ ...e, genero: undefined }))
                  }}
                />
                <span>Masculino</span>
              </label>
            </div>
            {errors.genero && (
              <span className="field-error">
                <AlertCircle size={14} />
                {errors.genero}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="cumpleanos">
              <Calendar size={16} />
              Fecha de nacimiento
            </label>
            <input
              id="cumpleanos"
              type="date"
              value={form.cumpleanos}
              onChange={e => setForm(f => ({ ...f, cumpleanos: e.target.value }))}
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="patologias">
              <FileText size={16} />
              Patologías o lesiones (opcional)
            </label>
            <textarea
              id="patologias"
              value={form.patologias}
              onChange={e => setForm(f => ({ ...f, patologias: e.target.value }))}
              rows={3}
              placeholder="Información relevante para tu profesor"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
