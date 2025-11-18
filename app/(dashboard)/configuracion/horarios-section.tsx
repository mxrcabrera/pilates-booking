'use client'

import { useState } from 'react'
import { Clock, Plus, Trash2, Edit2, MoreVertical } from 'lucide-react'
import { HorarioDialog } from './horario-dialog'
import { deleteHorario, toggleHorario } from './actions'

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
  horarios,
  horarioMananaInicio,
  horarioMananaFin,
  horarioTardeInicio,
  horarioTardeFin
}: HorariosSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedHorarios, setSelectedHorarios] = useState<Set<string>>(new Set())

  const handleEdit = (horario: Horario) => {
    setEditingHorario(horario)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingHorario(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar este horario?')) return
    try {
      await deleteHorario(id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await toggleHorario(id)
    } catch (err: any) {
      alert(err.message)
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

  const handleBulkDelete = async () => {
    if (selectedHorarios.size === 0) return
    if (!confirm(`¿Estás segura de eliminar ${selectedHorarios.size} horario(s)?`)) return

    try {
      await Promise.all(Array.from(selectedHorarios).map(id => deleteHorario(id)))
      setSelectedHorarios(new Set())
      setIsSelectionMode(false)
    } catch (err: any) {
      alert(err.message)
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
        <div className="section-actions" style={{ marginBottom: '1.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!isSelectionMode ? (
            <>
              <button
                onClick={handleNew}
                className="btn-primary"
              >
                <Plus size={18} />
                <span>Agregar Horario</span>
              </button>
              {horarios.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="btn-icon"
                  title="Seleccionar horarios"
                >
                  <MoreVertical size={20} />
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
                  onClick={handleBulkDelete}
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
              Agregar Horario
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
                          <div className="horario-slot-time-container">
                            <span className="horario-time">
                              {horario.horaInicio} - {horario.horaFin}
                            </span>
                            <span className="horario-turno">
                              {horario.esManiana ? 'Mañana' : 'Tarde'}
                            </span>
                          </div>
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
                              onClick={() => handleDelete(horario.id)}
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
      />
    </div>
  )
}