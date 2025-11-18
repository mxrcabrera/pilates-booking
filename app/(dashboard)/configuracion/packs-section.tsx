'use client'

import { useState } from 'react'
import { Package, Plus, Trash2, Edit2 } from 'lucide-react'
import { PackDialog } from './pack-dialog'
import { deletePack, togglePack } from './actions'

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type PacksSectionProps = {
  packs: Pack[]
}

export function PacksSection({ packs }: PacksSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingPack(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar este pack?')) return
    try {
      await deletePack(id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await togglePack(id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="settings-section">
      <div className="section-content">
        <div className="section-actions" style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleNew}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Nuevo Pack</span>
          </button>
        </div>

        {packs.length === 0 ? (
          <div className="empty-state-small">
            <Package size={32} strokeWidth={1} />
            <p>No tenés packs configurados</p>
            <button onClick={handleNew} className="btn-outline">
              Nuevo Pack
            </button>
          </div>
        ) : (
          <div className="packs-list">
            {packs.map(pack => (
              <div
                key={pack.id}
                className={`pack-card ${!pack.estaActivo ? 'inactive' : ''}`}
              >
                <div className="pack-card-info">
                  <h3 className="pack-nombre">{pack.nombre}</h3>
                  <div className="pack-details">
                    <span className="pack-clases">
                      {pack.clasesPorSemana} clase{pack.clasesPorSemana > 1 ? 's' : ''} por semana
                    </span>
                    <span className="pack-precio">
                      ${parseFloat(pack.precio).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                {!pack.estaActivo && (
                  <span className="pack-status-badge">Inactivo</span>
                )}
                <div className="pack-card-actions">
                  <button
                    onClick={() => handleEdit(pack)}
                    className="btn-icon-sm"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(pack.id)}
                    className="btn-icon-sm danger"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PackDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingPack(null)
        }}
        pack={editingPack}
      />
    </div>
  )
}
