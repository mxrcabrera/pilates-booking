'use client'

import { Edit2, Trash2 } from 'lucide-react'
import type { Alumno } from '@/lib/types'
import { PACK_LABELS } from '@/lib/constants'
import { getPaymentStatus, getStatusText, getClasesRestantes } from '@/lib/alumno-utils'

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
  viewMode?: 'list' | 'grid'
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelection?: () => void
}) {
  const getPackLabel = () => PACK_LABELS[alumno.packType] || alumno.packType

  const paymentStatus = getPaymentStatus(alumno)
  const statusText = getStatusText(alumno.genero, alumno.estaActivo)
  const clasesRestantes = getClasesRestantes(alumno)

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
              <span className="alumno-status-badge">{statusText}</span>
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
          <span className="alumno-status-badge">{statusText}</span>
        )}
      </div>
    </div>
  )
}
