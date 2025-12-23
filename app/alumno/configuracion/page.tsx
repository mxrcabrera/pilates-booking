'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, User, Phone, Calendar, FileText } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

type UserData = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  genero: string
  cumpleanos: string | null
  patologias: string | null
}

export default function AlumnoConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    genero: 'F',
    cumpleanos: '',
    patologias: ''
  })

  useEffect(() => {
    fetch('/api/alumno/perfil')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
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
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/alumno/perfil', {
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mi Perfil</h1>
        <p>Completá tus datos personales</p>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.text}
        </div>
      )}

      <div className="content-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="nombre">
              <User size={16} />
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              required
              minLength={2}
            />
          </div>

          <div className="form-field">
            <label htmlFor="telefono">
              <Phone size={16} />
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="11 1234-5678"
              required
              minLength={8}
            />
          </div>

          <div className="form-field">
            <label htmlFor="genero">Género</label>
            <div className="radio-group">
              <label className={`radio-option ${form.genero === 'F' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genero"
                  value="F"
                  checked={form.genero === 'F'}
                  onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                />
                <span>Femenino</span>
              </label>
              <label className={`radio-option ${form.genero === 'M' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genero"
                  value="M"
                  checked={form.genero === 'M'}
                  onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                />
                <span>Masculino</span>
              </label>
            </div>
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
