'use client'

import { useState } from 'react'
import { X, Edit2, UserX, UserCheck, Trash2, Loader2 } from 'lucide-react'
import { toggleAlumnoStatus, deleteAlumno } from './actions'
import { useToast } from '@/components/ui/toast'
import type { Alumno } from '@/lib/types'
import { PACK_LABELS } from '@/lib/constants'
import { getPaymentStatus, getStatusText, getClasesRestantesDetalle } from '@/lib/alumno-utils'
import { getErrorMessage } from '@/lib/utils'

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
  const [isLoading, setIsLoading] = useState<'toggle' | 'delete' | null>(null)
  const { showSuccess, showError } = useToast()

  if (!isOpen || !alumno) return null

  const handleToggleStatus = async () => {
    setIsLoading('toggle')
    try {
      await toggleAlumnoStatus(alumno.id)
      showSuccess(alumno.estaActivo ? 'Alumno desactivado' : 'Alumno activado')
      onClose()
    } catch (err) {
      showError(getErrorMessage(err) || 'Error al cambiar estado')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Estás segura de eliminar a ${alumno.nombre}? Esta acción no se puede deshacer.`)) return
    setIsLoading('delete')
    try {
      await deleteAlumno(alumno.id)
      showSuccess('Alumno eliminado')
      onClose()
    } catch (err) {
      showError(getErrorMessage(err) || 'Error al eliminar')
    } finally {
      setIsLoading(null)
    }
  }

  const getPackLabel = () => PACK_LABELS[alumno.packType] || alumno.packType

  const paymentStatus = getPaymentStatus(alumno)
  const statusText = getStatusText(alumno.genero, alumno.estaActivo)
  const clasesRestantes = getClasesRestantesDetalle(alumno)

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet-content">
        <button onClick={onClose} className="sheet-close-btn">
          <X size={16} />
        </button>

        <div className="sheet-body">
          {/* Header: avatar + info en la misma fila */}
          <div className="detail-header">
            <div className="detail-header-top">
              <div className="detail-card-avatar">
                {alumno.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="detail-header-info">
                <div className="detail-name-row">
                  <span className="detail-card-nombre">{alumno.nombre}</span>
                  {paymentStatus && (
                    <span className={`payment-badge ${paymentStatus.clase}`}>
                      {paymentStatus.texto}
                    </span>
                  )}
                  {!alumno.estaActivo && (
                    <span className="alumno-status-badge">{statusText}</span>
                  )}
                </div>
                <span className="detail-card-pack">{getPackLabel()}</span>
                {clasesRestantes && (
                  <span className="detail-card-clases">{clasesRestantes}</span>
                )}
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="detail-info-section">
            <div className="detail-info-row">
              <span className="detail-info-label">Precio</span>
              <span className="detail-info-value">${Number(alumno.precio).toLocaleString('es-AR')}</span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">Email</span>
              <a href={`mailto:${alumno.email}`} className="detail-info-link">{alumno.email}</a>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">Teléfono</span>
              <a href={`tel:${alumno.telefono}`} className="detail-info-link">{alumno.telefono}</a>
            </div>
            {alumno.clasesPorMes && (
              <div className="detail-info-row">
                <span className="detail-info-label">Clases este mes</span>
                <span className="detail-info-value">{alumno.clasesEsteMes} / {alumno.clasesPorMes}</span>
              </div>
            )}
          </div>

          {/* Patologías si hay */}
          {alumno.patologias && (
            <div className="detail-notes-section">
              <span className="detail-notes-label">Patologías / Notas</span>
              <p className="detail-notes-text">{alumno.patologias}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="detail-secondary-actions">
            <button onClick={onEdit} className="detail-action-btn" disabled={isLoading !== null}>
              <Edit2 size={16} />
              <span>Editar</span>
            </button>
            <button onClick={handleToggleStatus} className="detail-action-btn" disabled={isLoading !== null}>
              {isLoading === 'toggle' ? <Loader2 size={16} className="spin" /> : alumno.estaActivo ? <UserX size={16} /> : <UserCheck size={16} />}
              <span>{isLoading === 'toggle' ? 'Procesando...' : alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
            </button>
            <button onClick={handleDelete} className="detail-action-btn danger" disabled={isLoading !== null}>
              {isLoading === 'delete' ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              <span>{isLoading === 'delete' ? 'Eliminando...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
