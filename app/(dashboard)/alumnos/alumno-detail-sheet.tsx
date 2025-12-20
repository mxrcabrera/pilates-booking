'use client'

import { X, Edit2, UserX, UserCheck, Trash2 } from 'lucide-react'
import { toggleAlumnoStatus, deleteAlumno } from './actions'
import type { Alumno, Pack } from '@/lib/types'
import { PACK_LABELS } from '@/lib/constants'

type PaymentStatus = {
  texto: string
  clase: 'al-dia' | 'por-vencer' | 'vencido'
} | null

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

  // Pack label
  const getPackLabel = () => PACK_LABELS[alumno.packType] || alumno.packType

  // Status con género
  const getStatusText = () => {
    if (alumno.genero === 'M') {
      return alumno.estaActivo ? 'Activo' : 'Inactivo'
    }
    return alumno.estaActivo ? 'Activa' : 'Inactiva'
  }

  // Estado de pago
  const getPaymentStatus = (): PaymentStatus => {
    if (!alumno.estaActivo) return null

    if (!alumno.proximoPagoVencimiento) {
      return { texto: 'Al día', clase: 'al-dia' }
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(alumno.proximoPagoVencimiento)
    vencimiento.setHours(0, 0, 0, 0)
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (dias < 0) {
      const diasAtraso = Math.abs(dias)
      if (diasAtraso > 60) return { texto: 'Al día', clase: 'al-dia' }
      return { texto: 'Pago atrasado', clase: 'vencido' }
    }

    if (dias === 0) {
      return { texto: 'Vence hoy', clase: 'vencido' }
    }

    if (dias <= 7) {
      return { texto: `Vence en ${dias}d`, clase: 'por-vencer' }
    }

    return { texto: 'Al día', clase: 'al-dia' }
  }

  // Clases restantes
  const getClasesRestantes = () => {
    if (!alumno.clasesPorMes) return null
    const usadas = alumno.clasesEsteMes || 0
    const restantes = alumno.clasesPorMes - usadas
    if (restantes <= 0) return 'Sin clases disponibles'
    return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
  }

  const paymentStatus = getPaymentStatus()
  const clasesRestantes = getClasesRestantes()

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
                    <span className="alumno-status-badge">{getStatusText()}</span>
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
            <button onClick={onEdit} className="detail-action-btn">
              <Edit2 size={16} />
              <span>Editar</span>
            </button>
            <button onClick={handleToggleStatus} className="detail-action-btn">
              {alumno.estaActivo ? <UserX size={16} /> : <UserCheck size={16} />}
              <span>{alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
            </button>
            <button onClick={handleDelete} className="detail-action-btn danger">
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
