'use client'

import { X, Edit2, UserX, UserCheck, Trash2 } from 'lucide-react'
import { toggleAlumnoStatus, deleteAlumno } from './actions'
import type { Alumno, Pack } from '@/lib/types'

export function AlumnoDetailSheet({
  isOpen,
  onClose,
  alumno,
  onEdit,
  packs
}: {
  isOpen: boolean
  onClose: () => void
  alumno: Alumno | null
  onEdit: () => void
  packs: Pack[]
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

  // Buscar nombre del pack en la lista de packs
  const pack = packs.find(p => p.id === alumno.packType)
  const packLabel = pack?.nombre || (alumno.packType === 'por_clase' ? 'Por Clase' : alumno.packType)

  // Calcular clases restantes
  const tienePackConLimite = alumno.clasesPorMes && alumno.clasesPorMes > 0
  const clasesRestantes = tienePackConLimite ? alumno.clasesPorMes! - alumno.clasesEsteMes : null
  const sinClasesRestantes = clasesRestantes !== null && clasesRestantes <= 0

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet-content">
        <div className="sheet-header">
          <button onClick={onClose} className="close-btn sheet-close">
            <X size={20} />
          </button>
        </div>

        <div className="sheet-body">
          {/* Header: nombre + estado */}
          <div className="sheet-title-row">
            <h2>{alumno.nombre}</h2>
            <span className={`status-badge ${alumno.estaActivo ? 'active' : 'inactive'}`}>
              {alumno.estaActivo ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          {/* Bloque de info agrupada */}
          <div className="sheet-info-block">
            <div className="sheet-pricing">
              <span className="sheet-price">${Number(alumno.precio).toLocaleString('es-AR')}</span>
              <span className="sheet-pack">{packLabel}</span>
            </div>
            {tienePackConLimite ? (
              <div className={`sheet-clases-status ${sinClasesRestantes ? 'warning' : ''}`}>
                <span className="clases-usadas">{alumno.clasesEsteMes}/{alumno.clasesPorMes} clases usadas</span>
                {clasesRestantes !== null && clasesRestantes > 0 && (
                  <span className="clases-restantes">{clasesRestantes} restantes</span>
                )}
                {sinClasesRestantes && (
                  <span className="clases-excedidas">Sin clases disponibles</span>
                )}
              </div>
            ) : (
              <div className="sheet-meta">
                {alumno.clasesEsteMes} clases este mes
              </div>
            )}
            <div className="sheet-divider" />
            <div className="sheet-contact">
              <a href={`mailto:${alumno.email}`} className="sheet-contact-item">
                {alumno.email}
              </a>
              <a href={`tel:${alumno.telefono}`} className="sheet-contact-item">
                {alumno.telefono}
              </a>
            </div>
          </div>

          {/* Patologías si hay */}
          {alumno.patologias && (
            <p className="sheet-notes">{alumno.patologias}</p>
          )}

          {/* Acciones */}
          <div className="sheet-actions">
            <button onClick={onEdit} className="btn-primary sheet-action-btn">
              <Edit2 size={18} />
              <span>Editar</span>
            </button>
            <div className="sheet-secondary-actions">
              <button onClick={handleToggleStatus} className="sheet-link-btn">
                {alumno.estaActivo ? <UserX size={16} /> : <UserCheck size={16} />}
                <span>{alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
              </button>
              <button onClick={handleDelete} className="sheet-link-btn danger">
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
