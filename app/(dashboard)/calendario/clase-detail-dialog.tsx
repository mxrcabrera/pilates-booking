'use client'

import { useState, useEffect } from 'react'
import { Edit2, Trash2, CheckCircle, XCircle, UserX, RefreshCw, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteClaseAPI, changeClaseStatusAPI, changeAsistenciaAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { DialogBase } from '@/components/ui/dialog-base'
import type { Clase } from '@/lib/types'
import { DIAS_SEMANA_COMPLETO, ESTADO_LABELS, ASISTENCIA_LABELS, MS_PER_HOUR } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

const DIAS_NOMBRES: Record<number, string> = DIAS_SEMANA_COMPLETO.reduce((acc, dia, index) => {
  acc[index] = dia
  return acc
}, {} as Record<number, string>)

export function ClaseDetailDialog({
  isOpen,
  onClose,
  clase,
  onEdit,
  onEditSeries,
  onDelete,
  onStatusChange,
  horasAnticipacionMinima = 1
}: {
  isOpen: boolean
  onClose: () => void
  clase: Clase | null
  onEdit: () => void
  onEditSeries?: () => void
  onDelete?: (id: string) => Promise<void>
  onStatusChange?: (id: string, estado: string) => Promise<void>
  horasAnticipacionMinima?: number
}) {
  const { showSuccess, showError } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [currentEstado, setCurrentEstado] = useState(clase?.estado || 'reservada')
  const [currentAsistencia, setCurrentAsistencia] = useState(clase?.asistencia || 'pendiente')

  // Sincronizar estado cuando cambia la clase
  useEffect(() => {
    if (clase) {
      setCurrentEstado(clase.estado)
      setCurrentAsistencia(clase.asistencia)
    }
  }, [clase])

  // Calcular si podemos cancelar o marcar presente/ausente
  const ahora = new Date()

  // Construir fecha/hora de la clase
  const getClaseDateTime = () => {
    if (!clase) return new Date()
    const fechaClase = new Date(clase.fecha)
    const [horas, minutos] = clase.horaInicio.split(':').map(Number)
    fechaClase.setHours(horas, minutos, 0, 0)
    return fechaClase
  }

  const fechaHoraClase = getClaseDateTime()

  // Cancelar: habilitado si faltan más de X horas antes de la clase
  const tiempoHastaClase = fechaHoraClase.getTime() - ahora.getTime()
  const horasHastaClase = tiempoHastaClase / MS_PER_HOUR
  const puedeCancelar = horasHastaClase >= horasAnticipacionMinima

  // Presente/Ausente: habilitado solo desde que empieza la clase
  const claseYaEmpezo = ahora >= fechaHoraClase
  const puedeMarcarAsistencia = claseYaEmpezo

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
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (nuevoEstado: string) => {
    try {
      // Actualizar UI inmediatamente
      setCurrentEstado(nuevoEstado)

      if (onStatusChange) {
        await onStatusChange(clase.id, nuevoEstado)
      } else {
        await changeClaseStatusAPI(clase.id, nuevoEstado)
        showSuccess('Estado actualizado')
      }
    } catch (err) {
      setCurrentEstado(clase.estado)
      showError(getErrorMessage(err))
    }
  }

  const handleAsistenciaChange = async (nuevaAsistencia: string) => {
    try {
      setCurrentAsistencia(nuevaAsistencia)
      // También actualizar estado visual
      setCurrentEstado(nuevaAsistencia === 'pendiente' ? 'reservada' : 'completada')

      await changeAsistenciaAPI(clase.id, nuevaAsistencia)
      const mensajes: Record<string, string> = {
        presente: 'Marcado presente',
        ausente: 'Marcado ausente',
        pendiente: 'Asistencia desmarcada'
      }
      showSuccess(mensajes[nuevaAsistencia])
    } catch (err) {
      setCurrentAsistencia(clase.asistencia)
      setCurrentEstado(clase.estado)
      showError(getErrorMessage(err))
    }
  }

  const footerButtons = (
    <>
      <button onClick={() => setDeleteConfirmOpen(true)} className="btn-ghost danger">
        <Trash2 size={18} />
        <span>Eliminar</span>
      </button>
      <button onClick={onEdit} className="btn-primary">
        <Edit2 size={18} />
        <span>Editar</span>
      </button>
    </>
  )

  return (
    <>
      <DialogBase
        isOpen={isOpen}
        onClose={onClose}
        title="Detalle de Clase"
        footer={footerButtons}
      >
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
            <span className={`status-badge ${currentEstado}`}>
              {ESTADO_LABELS[currentEstado]}
            </span>
          </div>

          {clase.alumno && (
            <div className="detail-item">
              <span className="detail-label">Asistencia</span>
              <span className={`status-badge asistencia-${currentAsistencia}`}>
                {ASISTENCIA_LABELS[currentAsistencia]}
              </span>
            </div>
          )}

          {clase.alumno && clase.alumno.clasesPorMes && (() => {
            const porcentaje = (clase.clasesUsadasEsteMes / clase.alumno.clasesPorMes) * 100
            const colorClass = porcentaje >= 100 ? 'complete' : porcentaje >= 50 ? 'medium' : ''
            return (
              <div className="detail-item clases-progress-item">
                <span className="detail-label">Clases del mes</span>
                <span className="clases-progress-text">
                  {clase.clasesUsadasEsteMes}/{clase.alumno.clasesPorMes}
                </span>
                <div className="clases-progress-bar">
                  <div
                    className={`clases-progress-fill ${colorClass}`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
                {porcentaje >= 100 && (
                  <div className="pack-completo-alert">
                    Pack completado - Renovar pago
                  </div>
                )}
              </div>
            )
          })()}

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
                {clase.diasSemana.length}x por semana
              </span>
            </div>
          )}
        </div>

        <div className="clase-actions-section">
          <p className="section-label">Acciones rápidas</p>
          <div className="clase-actions-grid">
            {currentEstado === 'cancelada' ? (
              <button
                onClick={onEdit}
                className="action-btn primary"
              >
                <RefreshCw size={18} />
                <span>Reprogramar</span>
              </button>
            ) : (
              <>
                {clase.alumno && (
                  <>
                    {currentAsistencia === 'presente' ? (
                      <button
                        onClick={() => handleAsistenciaChange('ausente')}
                        className="action-btn danger"
                        disabled={!puedeMarcarAsistencia}
                        title={!puedeMarcarAsistencia ? 'Disponible desde que empiece la clase' : ''}
                      >
                        <UserX size={18} />
                        <span>Marcar ausente</span>
                      </button>
                    ) : currentAsistencia === 'ausente' ? (
                      <button
                        onClick={() => handleAsistenciaChange('presente')}
                        className="action-btn success"
                        disabled={!puedeMarcarAsistencia}
                        title={!puedeMarcarAsistencia ? 'Disponible desde que empiece la clase' : ''}
                      >
                        <CheckCircle size={18} />
                        <span>Marcar presente</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAsistenciaChange('presente')}
                          className="action-btn success"
                          disabled={!puedeMarcarAsistencia}
                          title={!puedeMarcarAsistencia ? 'Disponible desde que empiece la clase' : ''}
                        >
                          <CheckCircle size={18} />
                          <span>Presente</span>
                        </button>
                        <button
                          onClick={() => handleAsistenciaChange('ausente')}
                          className="action-btn danger"
                          disabled={!puedeMarcarAsistencia}
                          title={!puedeMarcarAsistencia ? 'Disponible desde que empiece la clase' : ''}
                        >
                          <UserX size={18} />
                          <span>Ausente</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                {clase.serieId && onEditSeries && (
                  <button onClick={onEditSeries} className="action-btn primary">
                    <Repeat size={18} />
                    <span>Editar serie</span>
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange('cancelada')}
                  className="action-btn warning"
                  disabled={!puedeCancelar}
                  title={!puedeCancelar ? `Solo se puede cancelar con ${horasAnticipacionMinima}h de anticipación` : ''}
                >
                  <XCircle size={18} />
                  <span>Cancelar clase</span>
                </button>
              </>
            )}
          </div>
        </div>
      </DialogBase>

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
    </>
  )
}