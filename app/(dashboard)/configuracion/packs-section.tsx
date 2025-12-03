'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Trash2, Edit2 } from 'lucide-react'
import { PackDialog } from './pack-dialog'
import { deletePackAPI, togglePackAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'

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

export function PacksSection({ packs: initialPacks }: PacksSectionProps) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [packs, setPacks] = useState(initialPacks)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingPack(null)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    setIsDeleting(true)
    try {
      await deletePackAPI(deleteConfirm.id)
      setPacks(prev => prev.filter(p => p.id !== deleteConfirm.id))
      invalidateCache(CACHE_KEYS.ALUMNOS) // Invalidar cache de alumnos
      showSuccess('Pack eliminado')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (err: any) {
      showError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggle = async (id: string) => {
    // Actualización optimista
    setPacks(prev => prev.map(p => p.id === id ? { ...p, estaActivo: !p.estaActivo } : p))
    try {
      await togglePackAPI(id)
      invalidateCache(CACHE_KEYS.ALUMNOS) // Invalidar cache de alumnos
      showSuccess('Estado actualizado')
    } catch (err: any) {
      // Revertir en caso de error
      setPacks(prev => prev.map(p => p.id === id ? { ...p, estaActivo: !p.estaActivo } : p))
      showError(err.message)
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
                    onClick={() => handleDeleteClick(pack.id)}
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
        onSuccess={(updatedPack, isEdit) => {
          if (isEdit) {
            setPacks(prev => prev.map(p => p.id === updatedPack.id ? updatedPack : p))
          } else {
            setPacks(prev => [...prev, updatedPack])
          }
          invalidateCache(CACHE_KEYS.ALUMNOS) // Invalidar cache de alumnos
        }}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="¿Eliminar este pack?"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
