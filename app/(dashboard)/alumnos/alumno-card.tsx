'use client'

import { Edit2, Trash2 } from 'lucide-react'
import type { Alumno } from '@/lib/types'
import { PACK_LABELS } from '@/lib/constants'

type PaymentStatus = {
  texto: string
  clase: 'al-dia' | 'por-vencer' | 'vencido'
} | null

export function AlumnoCard({
  alumno,
  onEdit,
  onView,
  onDelete,
  viewMode = 'list',
  selectionMode = false,
  isSelected = false,
  onToggleSelection
}: {
  alumno: Alumno
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  onToggleStatus: () => void
  viewMode?: 'list' | 'grid'
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelection?: () => void
}) {
  const getPackLabel = () => PACK_LABELS[alumno.packType] || alumno.packType

  // Status con género
  const getStatusText = () => {
    if (alumno.genero === 'M') {
      return alumno.estaActivo ? 'Activo' : 'Inactivo'
    }
    return alumno.estaActivo ? 'Activa' : 'Inactiva'
  }

  // Estado de pago - más descriptivo
  const getPaymentStatus = (): PaymentStatus => {
    if (!alumno.estaActivo) return null

    // Si no hay próximo pago pendiente = está al día
    if (!alumno.proximoPagoVencimiento) {
      return { texto: 'Al día', clase: 'al-dia' }
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(alumno.proximoPagoVencimiento)
    vencimiento.setHours(0, 0, 0, 0)
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    // Vencido (pasó la fecha)
    if (dias < 0) {
      const diasAtraso = Math.abs(dias)
      // Más de 60 días = datos incorrectos, mostrar al día
      if (diasAtraso > 60) return { texto: 'Al día', clase: 'al-dia' }
      return { texto: 'Pago atrasado', clase: 'vencido' }
    }

    // Vence hoy
    if (dias === 0) {
      return { texto: 'Vence hoy', clase: 'vencido' }
    }

    // Por vencer (próximos 7 días)
    if (dias <= 7) {
      return { texto: `Vence en ${dias}d`, clase: 'por-vencer' }
    }

    // Falta más de 7 días = al día
    return { texto: 'Al día', clase: 'al-dia' }
  }

  // Clases restantes del mes
  const getClasesRestantes = () => {
    if (!alumno.clasesPorMes) return null
    const usadas = alumno.clasesEsteMes || 0
    const restantes = alumno.clasesPorMes - usadas
    if (restantes <= 0) return null
    return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
  }

  const paymentStatus = getPaymentStatus()
  const clasesRestantes = getClasesRestantes()

  // Vista LISTA
  if (viewMode === 'list') {
    return (
      <div
        className={`alumno-row ${!alumno.estaActivo ? 'inactive' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={selectionMode ? onToggleSelection : onView}
      >
        {selectionMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="compact-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="alumno-row-info">
          <div className="alumno-row-main">
            <span className="alumno-row-nombre">{alumno.nombre}</span>
            {!alumno.estaActivo && (
              <span className="alumno-status-badge">{getStatusText()}</span>
            )}
          </div>
          <div className="alumno-row-details">
            <span className="alumno-row-pack">{getPackLabel()}</span>
            {clasesRestantes && (
              <span className="alumno-row-clases">{clasesRestantes}</span>
            )}
          </div>
        </div>
        <div className="alumno-row-right">
          {paymentStatus && (
            <span className={`payment-badge ${paymentStatus.clase}`}>
              {paymentStatus.texto}
            </span>
          )}
          {!selectionMode && (
            <div className="alumno-row-actions">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="btn-icon-sm"
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="btn-icon-sm danger"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vista GRID
  return (
    <div
      className={`alumno-card-grid ${!alumno.estaActivo ? 'inactive' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={selectionMode ? onToggleSelection : onView}
    >
      {selectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="compact-checkbox alumno-card-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="alumno-card-top">
        <div className="alumno-card-avatar">
          {alumno.nombre.charAt(0).toUpperCase()}
        </div>
        {!selectionMode && (
          <div className="alumno-card-actions">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="btn-icon-sm"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="btn-icon-sm danger"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="alumno-card-body">
        <span className="alumno-card-nombre">{alumno.nombre}</span>
        <span className="alumno-card-pack">{getPackLabel()}</span>
        {clasesRestantes && (
          <span className="alumno-card-clases">{clasesRestantes}</span>
        )}
      </div>

      <div className="alumno-card-footer">
        {paymentStatus ? (
          <span className={`payment-badge ${paymentStatus.clase}`}>
            {paymentStatus.texto}
          </span>
        ) : (
          <span className="alumno-status-badge">{getStatusText()}</span>
        )}
      </div>
    </div>
  )
}
