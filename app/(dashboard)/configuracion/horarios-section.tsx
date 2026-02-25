'use client'

import { useState } from 'react'
import { Clock, Plus, Trash2, Edit2, CheckSquare } from 'lucide-react'
import { HorarioDialog } from './horario-dialog'
import { deleteHorarioAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { SectionWrapper } from '@/components/ui/section-wrapper'
import type { Horario } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { DIAS_SEMANA_COMPLETO } from '@/lib/constants'

type HorariosSectionProps = {
  horarios: Horario[]
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
}


export function HorariosSection({
  horarios: initialHorarios,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin
}: HorariosSectionProps) {
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
  const [isDeleting, _setIsDeleting] = useState(false)

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
    const idToDelete = deleteConfirm.id
    if (!idToDelete) return

    // Guardar referencia antes de cerrar modal
    const horarioToDelete = horarios.find(h => h.id === idToDelete)

    // Cerrar modal primero
    setDeleteConfirm({ isOpen: false, id: null, isBulk: false })

    // Optimistic: eliminar de UI inmediatamente
    setHorarios(prev => {
      const filtered = prev.filter(h => h.id !== idToDelete)
      return filtered
    })
    showSuccess('Horario eliminado')

    // Si es ID temporal, no llamar API (todavía no existe en DB)
    if (idToDelete.startsWith('temp-')) {
      return
    }

    // API call en background
    deleteHorarioAPI(idToDelete).catch(err => {
      // Revertir en caso de error
      if (horarioToDelete) {
        setHorarios(prev => [...prev, horarioToDelete])
      }
      showError(getErrorMessage(err))
    })
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

    const idsToDelete = Array.from(selectedHorarios)
    const horariosToDelete = horarios.filter(h => selectedHorarios.has(h.id))

    // Optimistic: eliminar de UI inmediatamente
    setHorarios(prev => prev.filter(h => !selectedHorarios.has(h.id)))
    showSuccess(`${selectedHorarios.size} horario(s) eliminado(s)`)
    setSelectedHorarios(new Set())
    setIsSelectionMode(false)
    setDeleteConfirm({ isOpen: false, id: null, isBulk: false })

    // Solo llamar API para IDs reales (no temporales)
    const realIds = idsToDelete.filter(id => !id.startsWith('temp-'))
    if (realIds.length > 0) {
      Promise.all(realIds.map(id => deleteHorarioAPI(id))).catch(err => {
        // Revertir en caso de error
        setHorarios(prev => [...prev, ...horariosToDelete])
        showError(getErrorMessage(err))
      })
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
    <SectionWrapper>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!isSelectionMode ? (
            <>
              <button
                onClick={handleNew}
                className="btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.875rem 1.5rem', border: '2px solid transparent', boxShadow: 'none', whiteSpace: 'nowrap', flex: 1 }}
              >
                <Plus size={18} />
                <span>Nuevo Horario</span>
              </button>
              {horarios.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="btn-ghost"
                  title="Seleccionar múltiples"
                  style={{ fontSize: '0.875rem', padding: '0.875rem 1.5rem', whiteSpace: 'nowrap', flex: 1 }}
                >
                  <CheckSquare size={18} />
                  <span>Seleccionar</span>
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'stretch' }}>
              <button
                onClick={cancelSelectionMode}
                className="btn-outline"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', height: '36px', flex: '0 0 auto' }}
              >
                Cancelar
              </button>
              <button
                onClick={toggleSelectAll}
                className="btn-outline"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', height: '36px', flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {selectedHorarios.size === horarios.length ? 'Quitar selección' : 'Seleccionar todo'}
              </button>
              {selectedHorarios.size > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="btn-outline"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', height: '36px', color: '#ff6b6b', borderColor: '#ff6b6b', flex: '0 0 auto' }}
                >
                  <Trash2 size={14} />
                  <span>{selectedHorarios.size}</span>
                </button>
              )}
            </div>
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
                  <h3 className="horario-dia-nombre">{DIAS_SEMANA_COMPLETO[dia]}</h3>
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
        onBatchCreate={(nuevosHorarios) => {
          setHorarios(prev => {
            // Merge por diaSemana+esManiana (no por id) para reemplazar temporales con reales
            const horariosMap = new Map(prev.map(h => [`${h.diaSemana}-${h.esManiana}`, h]))
            nuevosHorarios.forEach(h => horariosMap.set(`${h.diaSemana}-${h.esManiana}`, h))
            return Array.from(horariosMap.values())
          })
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
    </SectionWrapper>
  )
}