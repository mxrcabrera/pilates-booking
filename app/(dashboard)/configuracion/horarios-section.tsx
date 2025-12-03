'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Plus, Trash2, Edit2, CheckSquare } from 'lucide-react'
import { HorarioDialog } from './horario-dialog'
import { deleteHorarioAPI, toggleHorarioAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

type HorariosSectionProps = {
  horarios: Horario[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function HorariosSection({
  horarios: initialHorarios,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin
}: HorariosSectionProps) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [horarios, setHorarios] = useState(initialHorarios)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedHorarios, setSelectedHorarios] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; isBulk: boolean }>({
    isOpen: false,
    id: null,
    isBulk: false
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (horario: Horario) => {
    setEditingHorario(horario)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingHorario(null)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, isBulk: false })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    setIsDeleting(true)
    try {
      await deleteHorarioAPI(deleteConfirm.id)
      // Actualizar estado local inmediatamente
      setHorarios(prev => prev.filter(h => h.id !== deleteConfirm.id))
      showSuccess('Horario eliminado')
      setDeleteConfirm({ isOpen: false, id: null, isBulk: false })
    } catch (err: any) {
      showError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggle = async (id: string) => {
    // Actualización optimista
    setHorarios(prev => prev.map(h => h.id === id ? { ...h, estaActivo: !h.estaActivo } : h))
    try {
      await toggleHorarioAPI(id)
      showSuccess('Estado actualizado')
    } catch (err: any) {
      // Revertir en caso de error
      setHorarios(prev => prev.map(h => h.id === id ? { ...h, estaActivo: !h.estaActivo } : h))
      showError(err.message)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedHorarios)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedHorarios(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedHorarios.size === horarios.length) {
      setSelectedHorarios(new Set())
    } else {
      setSelectedHorarios(new Set(horarios.map(h => h.id)))
    }
  }

  const handleBulkDeleteClick = () => {
    if (selectedHorarios.size === 0) return
    setDeleteConfirm({ isOpen: true, id: null, isBulk: true })
  }

  const handleBulkDelete = async () => {
    if (selectedHorarios.size === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedHorarios).map(id => deleteHorarioAPI(id)))
      // Actualizar estado local
      setHorarios(prev => prev.filter(h => !selectedHorarios.has(h.id)))
      showSuccess(`${selectedHorarios.size} horario(s) eliminado(s)`)
      setSelectedHorarios(new Set())
      setIsSelectionMode(false)
      setDeleteConfirm({ isOpen: false, id: null, isBulk: false })
    } catch (err: any) {
      showError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedHorarios(new Set())
  }

  // Agrupar horarios por día
  const horariosPorDia = horarios.reduce((acc, h) => {
    if (!acc[h.diaSemana]) acc[h.diaSemana] = []
    acc[h.diaSemana].push(h)
    return acc
  }, {} as Record<number, Horario[]>)

  return (
    <div className="settings-section">
      <div className="section-content">
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isSelectionMode ? (
            <>
              <button
                onClick={handleNew}
                className="btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', minHeight: 'auto', border: '2px solid transparent', boxShadow: 'none', whiteSpace: 'nowrap', flex: 1 }}
              >
                <Plus size={16} />
                <span>Nuevo Horario</span>
              </button>
              {horarios.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="btn-ghost"
                  title="Seleccionar múltiples"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', minHeight: 'auto', whiteSpace: 'nowrap', flex: 1 }}
                >
                  <CheckSquare size={16} />
                  <span>Seleccionar</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={cancelSelectionMode}
                className="btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={toggleSelectAll}
                className="btn-outline"
                style={{ fontSize: '0.875rem' }}
              >
                {selectedHorarios.size === horarios.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              {selectedHorarios.size > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="btn-outline"
                  style={{ fontSize: '0.875rem', color: '#ff6b6b', borderColor: '#ff6b6b' }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar ({selectedHorarios.size})</span>
                </button>
              )}
            </>
          )}
        </div>

        {horarios.length === 0 ? (
          <div className="empty-state-small">
            <Clock size={32} strokeWidth={1} />
            <p>No tenés horarios configurados</p>
            <button onClick={handleNew} className="btn-outline">
              Nuevo Horario
            </button>
          </div>
        ) : (
          <div className="horarios-list">
            {[1, 2, 3, 4, 5, 6, 0].map(dia => {
              const horariosDelDia = horariosPorDia[dia] || []
              if (horariosDelDia.length === 0) return null

              return (
                <div key={dia} className="horario-dia">
                  <h3 className="horario-dia-nombre">{DIAS[dia]}</h3>
                  <div className="horario-dia-slots">
                    {horariosDelDia.map(horario => (
                      <div
                        key={horario.id}
                        className={`horario-slot ${!horario.estaActivo ? 'inactive' : ''} ${selectedHorarios.has(horario.id) ? 'selected' : ''}`}
                      >
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedHorarios.has(horario.id)}
                            onChange={() => toggleSelection(horario.id)}
                            className="horario-checkbox"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="horario-slot-info">
                          <span className="horario-time">
                            {horario.horaInicio} - {horario.horaFin}
                          </span>
                          <span className="horario-turno">
                            {horario.esManiana ? 'Mañana' : 'Tarde'}
                          </span>
                        </div>
                        {!horario.estaActivo && (
                          <span className="horario-status-badge">Inactivo</span>
                        )}
                        {!isSelectionMode && (
                          <div className="horario-slot-actions">
                            <button
                              onClick={() => handleEdit(horario)}
                              className="btn-icon-sm"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(horario.id)}
                              className="btn-icon-sm danger"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <HorarioDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingHorario(null)
        }}
        horario={editingHorario}
        horarios={horarios}
        horarioMananaInicio={horarioMananaInicio}
        horarioMananaFin={horarioMananaFin}
        horarioTardeInicio={horarioTardeInicio}
        horarioTardeFin={horarioTardeFin}
        onSuccess={(newHorario, isEdit) => {
          if (isEdit) {
            setHorarios(prev => prev.map(h => h.id === newHorario.id ? newHorario : h))
          } else {
            setHorarios(prev => [...prev, newHorario])
          }
        }}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, isBulk: false })}
        onConfirm={deleteConfirm.isBulk ? handleBulkDelete : handleDelete}
        title={deleteConfirm.isBulk
          ? `¿Eliminar ${selectedHorarios.size} horario(s)?`
          : '¿Eliminar este horario?'
        }
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}