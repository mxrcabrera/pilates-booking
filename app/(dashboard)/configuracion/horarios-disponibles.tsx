'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Lock } from 'lucide-react'

interface HorarioGrupo {
  id: string
  dias: string[]
  inicio: string
  fin: string
  turno: string
  disponible: boolean
}

interface Props {
  horarios: HorarioGrupo[]
  onAgregarHorario: () => void
  onEditar: (id: string) => void
  onEliminar: (id: string) => void
  onAgregarDisponibilidad: (dia: string) => void
  canConfigureHorarios?: boolean
  currentPlan?: string
}

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

export function HorariosDisponibles({
  horarios,
  onAgregarHorario,
  onEditar,
  onEliminar,
  onAgregarDisponibilidad,
  canConfigureHorarios = true,
  currentPlan = 'STARTER'
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const formatRangoDias = (dias: string[]) => {
    if (dias.length === 1) return dias[0].charAt(0).toUpperCase() + dias[0].slice(1)
    if (dias.length === 5 && dias.includes('lunes') && dias.includes('viernes')) {
      return 'Lunes a Viernes'
    }
    return dias[0].charAt(0).toUpperCase() + dias[0].slice(1)
  }

  return (
    <div className="section-content">
      {/* Header simple */}
      <div className="horarios-header">
        <div>
          <h2 className="horarios-header-title">Horarios Disponibles</h2>
          <p className="horarios-header-subtitle">Configurá tus días y horarios de atención</p>
        </div>
        <button
          onClick={() => canConfigureHorarios && onAgregarHorario()}
          className={`btn-primary btn-sm ${!canConfigureHorarios ? 'btn-locked' : ''}`}
          disabled={!canConfigureHorarios}
          title={!canConfigureHorarios ? `Disponible en plan ${PLAN_NAMES['STARTER']}` : undefined}
        >
          {!canConfigureHorarios ? <Lock size={14} /> : <Plus size={16} />}
          <span>Nuevo</span>
        </button>
      </div>
      {!canConfigureHorarios && (
        <p className="feature-locked-hint" style={{ marginBottom: '1rem' }}>
          La configuración de horarios está disponible desde el plan {PLAN_NAMES['STARTER']}
        </p>
      )}

      {/* Lista simple de horarios */}
      <div className="horarios-lista">
        {horarios.map(horario => {
          const isExpanded = expanded === horario.id
          const rangoDias = formatRangoDias(horario.dias)

          return (
            <div key={horario.id} className="horario-item">
              <div
                className="horario-item-row"
                onClick={() => horario.disponible && horario.dias.length > 1 && setExpanded(isExpanded ? null : horario.id)}
              >
                <div className="horario-item-info">
                  <span className="horario-item-dia">{rangoDias}</span>
                  {horario.disponible ? (
                    <span className="horario-item-tiempo">
                      {horario.inicio} - {horario.fin}
                      <span className="horario-item-turno">{horario.turno}</span>
                    </span>
                  ) : (
                    <span className="horario-item-sin">Sin horario</span>
                  )}
                </div>

                <div className="horario-item-action">
                  {horario.disponible ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditar(horario.id)
                        }}
                        className="horario-action-btn"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEliminar(horario.id)
                        }}
                        className="horario-action-btn horario-action-btn-danger"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                      {horario.dias.length > 1 && (
                        isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                      )}
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAgregarDisponibilidad(horario.dias[0])
                      }}
                      className="horario-item-agregar"
                    >
                      Agregar
                    </button>
                  )}
                </div>
              </div>

              {/* Expansión para días individuales */}
              {isExpanded && horario.disponible && horario.dias.length > 1 && (
                <div className="horario-item-expansion">
                  {horario.dias.map(dia => (
                    <div key={dia} className="horario-subitem">
                      <span className="horario-subitem-dia">
                        {dia.charAt(0).toUpperCase() + dia.slice(1)}
                      </span>
                      <span className="horario-subitem-tiempo">
                        {horario.inicio} - {horario.fin}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
