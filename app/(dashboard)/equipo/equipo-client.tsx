'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Users, UserPlus, Shield, Eye, Edit3, Trash2, Crown, X } from 'lucide-react'
import type { EstudioRol } from '@prisma/client'

interface Miembro {
  id: string
  usuarioId: string
  nombre: string | null
  email: string
  image: string | null
  rol: EstudioRol
  createdAt: string
}

interface EquipoData {
  miembros: Miembro[]
  estudio: {
    id: string
    nombre: string
    slug: string
  }
  miRol: EstudioRol
}

const ROL_INFO: Record<EstudioRol, { label: string; icon: typeof Crown; color: string; desc: string }> = {
  OWNER: { label: 'Dueño', icon: Crown, color: '#f59e0b', desc: 'Acceso total incluyendo facturación' },
  ADMIN: { label: 'Admin', icon: Shield, color: '#8b5cf6', desc: 'Todo excepto facturación' },
  INSTRUCTOR: { label: 'Instructor', icon: Edit3, color: '#06b6d4', desc: 'Gestiona sus propias clases' },
  VIEWER: { label: 'Visor', icon: Eye, color: '#6b7280', desc: 'Solo lectura' }
}

export function EquipoClient() {
  const [data, setData] = useState<EquipoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRol, setInviteRol] = useState<EstudioRol>('INSTRUCTOR')
  const [submitting, setSubmitting] = useState(false)

  const fetchEquipo = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/equipo')
      if (!res.ok) throw new Error('Error al cargar equipo')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEquipo()
  }, [fetchEquipo])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, rol: inviteRol })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRol('INSTRUCTOR')
      fetchEquipo()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al invitar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeRol = async (miembroId: string, nuevoRol: EstudioRol) => {
    try {
      const res = await fetch('/api/v1/equipo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miembroId, nuevoRol })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      fetchEquipo()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar rol')
    }
  }

  const handleRemove = async (miembroId: string, nombre: string) => {
    if (!confirm(`¿Remover a ${nombre || 'este miembro'} del equipo?`)) return
    try {
      const res = await fetch(`/api/v1/equipo?id=${miembroId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      fetchEquipo()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al remover')
    }
  }

  const canManage = data?.miRol === 'OWNER' || data?.miRol === 'ADMIN'

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Cargando equipo...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">{error}</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Users size={24} />
            Equipo
          </h1>
          <p className="page-subtitle">{data.estudio.nombre}</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} />
            Invitar
          </button>
        )}
      </div>

      <div className="equipo-grid">
        {data.miembros.map((miembro) => {
          const rolInfo = ROL_INFO[miembro.rol]
          const RolIcon = rolInfo.icon
          const isOwner = miembro.rol === 'OWNER'
          const canEdit = canManage && !isOwner && data.miRol === 'OWNER' || (data.miRol === 'ADMIN' && miembro.rol !== 'ADMIN')

          return (
            <div key={miembro.id} className="equipo-card">
              <div className="equipo-card-header">
                {miembro.image ? (
                  <Image src={miembro.image} alt="" width={48} height={48} className="equipo-avatar" />
                ) : (
                  <div className="equipo-avatar equipo-avatar-placeholder">
                    {(miembro.nombre || miembro.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="equipo-info">
                  <h3 className="equipo-name">{miembro.nombre || 'Sin nombre'}</h3>
                  <p className="equipo-email">{miembro.email}</p>
                </div>
              </div>

              <div className="equipo-rol" style={{ '--rol-color': rolInfo.color } as React.CSSProperties}>
                <RolIcon size={16} />
                <span>{rolInfo.label}</span>
              </div>

              {canEdit && (
                <div className="equipo-actions">
                  <select
                    value={miembro.rol}
                    onChange={(e) => handleChangeRol(miembro.id, e.target.value as EstudioRol)}
                    className="equipo-rol-select"
                  >
                    {data.miRol === 'OWNER' && <option value="ADMIN">Admin</option>}
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="VIEWER">Visor</option>
                  </select>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleRemove(miembro.id, miembro.nombre || miembro.email)}
                    title="Remover del equipo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="roles-info">
        <h3>Roles y permisos</h3>
        <div className="roles-grid">
          {Object.entries(ROL_INFO).map(([rol, info]) => {
            const Icon = info.icon
            return (
              <div key={rol} className="role-card" style={{ '--rol-color': info.color } as React.CSSProperties}>
                <div className="role-header">
                  <Icon size={18} />
                  <span>{info.label}</span>
                </div>
                <p>{info.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invitar miembro</h2>
              <button className="btn-icon" onClick={() => setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label htmlFor="email">Email del usuario</label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                />
                <p className="form-hint">El usuario debe estar registrado en la plataforma</p>
              </div>
              <div className="form-group">
                <label htmlFor="rol">Rol</label>
                <select
                  id="rol"
                  value={inviteRol}
                  onChange={(e) => setInviteRol(e.target.value as EstudioRol)}
                >
                  {data.miRol === 'OWNER' && <option value="ADMIN">Admin</option>}
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="VIEWER">Visor</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Invitando...' : 'Invitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
