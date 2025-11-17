'use client'

import { X, Edit2, Trash2, CheckCircle, XCircle, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteClase, changeClaseStatus } from './actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Clase = {
  id: string
  fecha: Date
  horaInicio: string
  diasSemana: number[]
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  alumno: {
    id: string
    nombre: string
  } | null
}

const ESTADO_LABELS: Record<string, string> = {
  reservada: 'Reservada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  ausente: 'Ausente'
}

const DIAS_NOMBRES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
}

export function ClaseDetailDialog({
  isOpen,
  onClose,
  clase,
  onEdit
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  onEdit: () => void
}) {
  if (!clase) return null

  const handleDelete = async () => {
    if (!confirm('¿Estás segura de eliminar esta clase?')) return
    try {
      await deleteClase(clase.id)
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleStatusChange = async (nuevoEstado: string) => {
    try {
      await changeClaseStatus(clase.id, nuevoEstado)
      onClose()
    } catch (err: any) {
      alert(err.message)
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
          <button onClick={handleDelete} className="btn-ghost danger">
            <Trash2 size={18} />
            <span>Eliminar</span>
          </button>
          <button onClick={onEdit} className="btn-primary">
            <Edit2 size={18} />
            <span>Editar</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}