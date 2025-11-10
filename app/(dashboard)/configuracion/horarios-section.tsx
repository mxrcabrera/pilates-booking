'use client'

import { useState } from 'react'
import { Clock, Plus, Trash2, Edit2 } from 'lucide-react'
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

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function HorariosSection({ horarios }: { horarios: Horario[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null)

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

  // Agrupar horarios por día
  const horariosPorDia = horarios.reduce((acc, h) => {
    if (!acc[h.diaSemana]) acc[h.diaSemana] = []
    acc[h.diaSemana].push(h)
    return acc
  }, {} as Record<number, Horario[]>)

  return (
    <div className="settings-section">
      <div className="section-header">
        <Clock size={20} />
        <h2>Horarios de Atención</h2>
        <button 
          onClick={handleNew}
          className="btn-icon-sm"
          title="Agregar horario"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="section-content">
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
                        className={`horario-slot ${!horario.estaActivo ? 'inactive' : ''}`}
                      >
                        <div className="horario-slot-info">
                          <span className="horario-time">
                            {horario.horaInicio} - {horario.horaFin}
                          </span>
                          <span className="horario-turno">
                            {horario.esManiana ? 'Mañana' : 'Tarde'}
                          </span>
                        </div>
                        <div className="horario-slot-actions">
                          <button
                            onClick={() => handleToggle(horario.id)}
                            className="btn-icon-xs"
                            title={horario.estaActivo ? 'Desactivar' : 'Activar'}
                          >
                            {horario.estaActivo ? '✓' : '○'}
                          </button>
                          <button
                            onClick={() => handleEdit(horario)}
                            className="btn-icon-xs"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(horario.id)}
                            className="btn-icon-xs danger"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
      />
    </div>
  )
}