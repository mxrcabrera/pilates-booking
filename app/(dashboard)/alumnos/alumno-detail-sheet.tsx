'use client'

import { X, Mail, Phone, Calendar, Cake, FileText, Edit2, Trash2, UserX, UserCheck } from 'lucide-react'
import { toggleAlumnoStatus, deleteAlumno } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
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

export function AlumnoDetailSheet({
  isOpen,
  onClose,
  alumno,
  onEdit
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  onEdit: () => void
}) {
  if (!isOpen || !alumno) return null

  const handleToggleStatus = async () => {
    try {
      await toggleAlumnoStatus(alumno.id)
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Estás segura de eliminar a ${alumno.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteAlumno(alumno.id)
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
              {alumno.nombre.charAt(0).toUpperCase()}
            </div>
            <h2>{alumno.nombre}</h2>
            <span className={`status-badge ${alumno.estaActivo ? 'active' : 'inactive'}`}>
              {alumno.estaActivo ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <div className="sheet-section">
            <h3 className="sheet-section-title">Contacto</h3>
            <div className="sheet-details">
              <div className="sheet-detail-row">
                <Mail size={18} />
                <div>
                  <p className="detail-label">Email</p>
                  <p className="detail-value">{alumno.email}</p>
                </div>
              </div>
              <div className="sheet-detail-row">
                <Phone size={18} />
                <div>
                  <p className="detail-label">Teléfono</p>
                  <p className="detail-value">{alumno.telefono}</p>
                </div>
              </div>
              {alumno.cumpleanos && (
                <div className="sheet-detail-row">
                  <Cake size={18} />
                  <div>
                    <p className="detail-label">Cumpleaños</p>
                    <p className="detail-value">
                      {format(new Date(alumno.cumpleanos), "d 'de' MMMM", { locale: es })}
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
                  <p className="detail-value">{PACK_LABELS[alumno.packType]}</p>
                </div>
              </div>
              {alumno.clasesPorMes && (
                <div className="sheet-detail-row">
                  <Calendar size={18} />
                  <div>
                    <p className="detail-label">Clases por mes</p>
                    <p className="detail-value">{alumno.clasesPorMes} clases</p>
                  </div>
                </div>
              )}
              <div className="sheet-detail-row">
                <span className="sheet-price-icon">$</span>
                <div>
                  <p className="detail-label">Precio</p>
                  <p className="detail-value">${alumno.precio} ARS</p>
                </div>
              </div>
            </div>
          </div>

          {alumno.patologias && (
            <div className="sheet-section">
              <h3 className="sheet-section-title">Patologías / Observaciones</h3>
              <div className="sheet-patologias">
                <p>{alumno.patologias}</p>
              </div>
            </div>
          )}

          <div className="sheet-section">
            <h3 className="sheet-section-title">Estadísticas</h3>
            <div className="sheet-stats">
              <div className="sheet-stat">
                <p className="stat-value">{alumno._count.clases}</p>
                <p className="stat-label">Clases</p>
              </div>
              <div className="sheet-stat">
                <p className="stat-value">{alumno._count.pagos}</p>
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
              {alumno.estaActivo ? <UserX size={20} /> : <UserCheck size={20} />}
              <span>{alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
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