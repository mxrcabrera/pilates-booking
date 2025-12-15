'use client'

import { useState } from 'react'
import { Edit2, Trash2, CheckCircle, XCircle, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteClaseAPI, changeClaseStatusAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Clase } from '@/lib/types'
import { DIAS_SEMANA_COMPLETO } from '@/lib/constants'

const ESTADO_LABELS: Record<string, string> = {
  reservada: 'Reservada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  ausente: 'Ausente'
}

const DIAS_NOMBRES: Record<number, string> = DIAS_SEMANA_COMPLETO.reduce((acc, dia, index) => {
  acc[index] = dia
  return acc
}, {} as Record<number, string>)

export function ClaseDetailDialog({
  isOpen,
  onClose,
  clase,
  onEdit,
  onDelete,
  onStatusChange
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  onEdit: () => void
  onDelete?: (id: string) => Promise<void>
  onStatusChange?: (id: string, estado: string) => Promise<void>
}) {
  const { showSuccess, showError } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (!clase) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(clase.id)
      } else {
        await deleteClaseAPI(clase.id)
        showSuccess('Clase eliminada')
      }
      setDeleteConfirmOpen(false)
      onClose()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (nuevoEstado: string) => {
    try {
      if (onStatusChange) {
        await onStatusChange(clase.id, nuevoEstado)
      } else {
        await changeClaseStatusAPI(clase.id, nuevoEstado)
        showSuccess('Estado actualizado')
      }
      onClose()
    } catch (err: any) {
      showError(err.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle de Clase</DialogTitle>
        </DialogHeader>

        <div className="dialog-body">
          <div className="clase-detail-section">
            <div className="detail-item">
              <span className="detail-label">Alumno</span>
              <span className="detail-value">
                {clase.alumno?.nombre || 'Sin asignar'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Fecha</span>
              <span className="detail-value">
                {format(clase.fecha, "EEEE, d 'de' MMMM", { locale: es })}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Hora</span>
              <span className="detail-value">{clase.horaInicio}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <span className={`status-badge ${clase.estado}`}>
                {ESTADO_LABELS[clase.estado]}
              </span>
            </div>

            {clase.esClasePrueba && (
              <div className="detail-item">
                <span className="clase-prueba-badge">Clase de Prueba</span>
              </div>
            )}

            {clase.esRecurrente && clase.diasSemana.length > 0 && (
              <div className="detail-item">
                <span className="detail-label">Días de clase</span>
                <span className="detail-value">
                  {clase.diasSemana.map(dia => DIAS_NOMBRES[dia]).join(', ')}
                </span>
              </div>
            )}

            {clase.esRecurrente && (
              <div className="detail-item">
                <span className="detail-label">Frecuencia</span>
                <span className="detail-value">
                  🔁 {clase.frecuenciaSemanal}x por semana
                </span>
              </div>
            )}
          </div>

          <div className="clase-actions-section">
            <p className="section-label">Acciones rápidas</p>
            <div className="clase-actions-grid">
              {clase.estado !== 'completada' && (
                <button
                  onClick={() => handleStatusChange('completada')}
                  className="action-btn success"
                >
                  <CheckCircle size={18} />
                  <span>Marcar Completada</span>
                </button>
              )}
              {clase.estado !== 'cancelada' && (
                <button
                  onClick={() => handleStatusChange('cancelada')}
                  className="action-btn warning"
                >
                  <XCircle size={18} />
                  <span>Cancelar</span>
                </button>
              )}
              {clase.estado !== 'ausente' && (
                <button
                  onClick={() => handleStatusChange('ausente')}
                  className="action-btn danger"
                >
                  <UserX size={18} />
                  <span>Marcar Ausente</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button onClick={() => setDeleteConfirmOpen(true)} className="btn-ghost danger">
            <Trash2 size={18} />
            <span>Eliminar</span>
          </button>
          <button onClick={onEdit} className="btn-primary">
            <Edit2 size={18} />
            <span>Editar</span>
          </button>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar esta clase?"
        description={`Se eliminará la clase de ${clase.alumno?.nombre || 'Sin asignar'} del ${format(clase.fecha, "d 'de' MMMM", { locale: es })}`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </Dialog>
  )
}