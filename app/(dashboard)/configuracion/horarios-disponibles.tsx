'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Lock } from 'lucide-react'
import { PLAN_NAMES, DIAS_SEMANA_COMPLETO } from '@/lib/constants'

export interface HorarioGrupo {
  id: string
  dias: string[]
  diasDetalle: { id: string; diaSemana: number }[]
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
}

export function HorariosDisponibles({
  horarios,
  onAgregarHorario,
  onEditar,
  onEliminar,
  onAgregarDisponibilidad,
  canConfigureHorarios = true,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const getDiasLabel = (diasIndices: number[]) => {
    if (diasIndices.length === 0) return ''
    if (diasIndices.length === 1) return DIAS_SEMANA_COMPLETO[diasIndices[0]]
    if (diasIndices.length === 7) return 'Todos los días'

    // Especial: Lunes a Viernes (1-5)
    const isLV = diasIndices.length === 5 && diasIndices.every(d => d >= 1 && d <= 5)
    if (isLV) return 'Lunes a Viernes'

    // Ordenar (1-6, 0)
    const sorted = [...diasIndices].sort((a, b) => {
      const d_a = a === 0 ? 7 : a
      const d_b = b === 0 ? 7 : b
      return d_a - d_b
    })

    // Detectar rangos consecutivos
    const groups: number[][] = []
    let currentGroup: number[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1] === 0 ? 7 : sorted[i - 1]
      const curr = sorted[i] === 0 ? 7 : sorted[i]

      if (curr === prev + 1) {
        currentGroup.push(sorted[i])
      } else {
        groups.push(currentGroup)
        currentGroup = [sorted[i]]
      }
    }
    groups.push(currentGroup)

    // Formatear cada grupo
    const labels = groups.map(group => {
      if (group.length === 1) return DIAS_SEMANA_COMPLETO[group[0]]
      if (group.length === 2) return `${DIAS_SEMANA_COMPLETO[group[0]]}, ${DIAS_SEMANA_COMPLETO[group[1]]}`
      return `${DIAS_SEMANA_COMPLETO[group[0]]} a ${DIAS_SEMANA_COMPLETO[group[group.length - 1]]}`
    })

    // Unir todos los fragmentos con comas, y un último "y"
    const flatLabels = labels.join(', ').split(', ')
    if (flatLabels.length === 1) return flatLabels[0]
    const last = flatLabels.pop()
    return `${flatLabels.join(', ')} y ${last}`
  }

  return (
    <div className="section-content">
      {/* Header simple */}
      <div className="horarios-header">
        <div>
          <h3 className="horarios-header-title">Horarios Disponibles</h3>
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
          const rangoDias = getDiasLabel(horario.diasDetalle.map(d => d.diaSemana))

          return (
            <div key={horario.id} className="horario-item">
              <div
                className="horario-item-row"
                onClick={() => horario.disponible && horario.diasDetalle.length > 1 && setExpanded(isExpanded ? null : horario.id)}
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
                        title="Editar grupo"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEliminar(horario.id)
                        }}
                        className="horario-action-btn horario-action-btn-danger"
                        title="Eliminar grupo"
                      >
                        <Trash2 size={15} />
                      </button>
                      {horario.diasDetalle.length > 1 && (
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
              {isExpanded && horario.disponible && horario.diasDetalle.length > 1 && (
                <div className="horario-item-expansion">
                  {horario.diasDetalle.map(detalle => (
                    <div key={detalle.id} className="horario-subitem">
                      <div className="flex items-center gap-3">
                        <span className="horario-subitem-dia">
                          {DIAS_SEMANA_COMPLETO[detalle.diaSemana]}
                        </span>
                        <span className="horario-subitem-tiempo">
                          {horario.inicio} - {horario.fin}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditar(detalle.id)
                          }}
                          className="horario-subitem-action"
                          title="Editar día individual"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEliminar(detalle.id)
                          }}
                          className="horario-subitem-action text-red-400/50 hover:text-red-400"
                          title="Eliminar día individual"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
