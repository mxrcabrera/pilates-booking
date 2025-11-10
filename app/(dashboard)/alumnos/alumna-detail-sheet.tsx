'use client'

import { X, Mail, Phone, Calendar, Cake, FileText, Edit2, Trash2, UserX, UserCheck } from 'lucide-react'
import { toggleAlumnaStatus, deleteAlumna } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Alumna = {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActiva: boolean
  _count: {
    clases: number
    pagos: number
  }
}

const PACK_LABELS: Record<string, string> = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  'pack_4': 'Pack 4 Clases',
  'pack_8': 'Pack 8 Clases',
  'pack_12': 'Pack 12 Clases'
}

export function AlumnaDetailSheet({
  isOpen,
  onClose,
  alumna,
  onEdit
}: {
  isOpen: boolean
  onClose: () => void
  alumna: Alumna | null
  onEdit: () => void
}) {
  if (!isOpen || !alumna) return null

  const handleToggleStatus = async () => {
    try {
      await toggleAlumnaStatus(alumna.id)
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Estás segura de eliminar a ${alumna.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteAlumna(alumna.id)
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet-content">
        <div className="sheet-header">
          <div className="sheet-handle" />
          <button onClick={onClose} className="sheet-close">
            <X size={24} />
          </button>
        </div>

        <div className="sheet-body">
          <div className="sheet-profile">
            <div className="sheet-avatar">
              {alumna.nombre.charAt(0).toUpperCase()}
            </div>
            <h2>{alumna.nombre}</h2>
            <span className={`status-badge ${alumna.estaActiva ? 'active' : 'inactive'}`}>
              {alumna.estaActiva ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <div className="sheet-section">
            <h3 className="sheet-section-title">Contacto</h3>
            <div className="sheet-details">
              <div className="sheet-detail-row">
                <Mail size={18} />
                <div>
                  <p className="detail-label">Email</p>
                  <p className="detail-value">{alumna.email}</p>
                </div>
              </div>
              <div className="sheet-detail-row">
                <Phone size={18} />
                <div>
                  <p className="detail-label">Teléfono</p>
                  <p className="detail-value">{alumna.telefono}</p>
                </div>
              </div>
              {alumna.cumpleanos && (
                <div className="sheet-detail-row">
                  <Cake size={18} />
                  <div>
                    <p className="detail-label">Cumpleaños</p>
                    <p className="detail-value">
                      {format(new Date(alumna.cumpleanos), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sheet-section">
            <h3 className="sheet-section-title">Plan</h3>
            <div className="sheet-details">
              <div className="sheet-detail-row">
                <FileText size={18} />
                <div>
                  <p className="detail-label">Tipo de Pack</p>
                  <p className="detail-value">{PACK_LABELS[alumna.packType]}</p>
                </div>
              </div>
              {alumna.clasesPorMes && (
                <div className="sheet-detail-row">
                  <Calendar size={18} />
                  <div>
                    <p className="detail-label">Clases por mes</p>
                    <p className="detail-value">{alumna.clasesPorMes} clases</p>
                  </div>
                </div>
              )}
              <div className="sheet-detail-row">
                <span className="sheet-price-icon">$</span>
                <div>
                  <p className="detail-label">Precio</p>
                  <p className="detail-value">${alumna.precio} ARS</p>
                </div>
              </div>
            </div>
          </div>

          {alumna.patologias && (
            <div className="sheet-section">
              <h3 className="sheet-section-title">Patologías / Observaciones</h3>
              <div className="sheet-patologias">
                <p>{alumna.patologias}</p>
              </div>
            </div>
          )}

          <div className="sheet-section">
            <h3 className="sheet-section-title">Estadísticas</h3>
            <div className="sheet-stats">
              <div className="sheet-stat">
                <p className="stat-value">{alumna._count.clases}</p>
                <p className="stat-label">Clases</p>
              </div>
              <div className="sheet-stat">
                <p className="stat-value">{alumna._count.pagos}</p>
                <p className="stat-label">Pagos</p>
              </div>
            </div>
          </div>

          <div className="sheet-actions">
            <button onClick={onEdit} className="btn-primary sheet-action-btn">
              <Edit2 size={20} />
              <span>Editar</span>
            </button>
            <button onClick={handleToggleStatus} className="btn-outline sheet-action-btn">
              {alumna.estaActiva ? <UserX size={20} /> : <UserCheck size={20} />}
              <span>{alumna.estaActiva ? 'Desactivar' : 'Activar'}</span>
            </button>
            <button onClick={handleDelete} className="btn-ghost danger sheet-action-btn">
              <Trash2 size={20} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}