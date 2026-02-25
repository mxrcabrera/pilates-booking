'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { PackDialog } from './pack-dialog'
import { deletePackAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import type { Pack } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

type PacksSectionProps = {
  packs: Pack[]
  renderButton?: (onClick: () => void) => React.ReactNode
}

export function PacksSection({ packs: initialPacks, renderButton }: PacksSectionProps) {
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
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {renderButton ? (
        renderButton(handleNew)
      ) : (
        <div className="packs-header">
          <button
            onClick={handleNew}
            className="btn-primary btn-sm"
          >
            <Plus size={16} />
            <span>Nuevo Pack</span>
          </button>
        </div>
      )}

      {packs.length === 0 ? (
        <p className="form-hint" style={{ margin: 0 }}>No tenés packs configurados</p>
      ) : (
        <div className="packs-list">
          {packs.map(pack => (
            <div
              key={pack.id}
              className="pack-card"
            >
              <div className="pack-card-info">
                <span className="pack-nombre">{pack.nombre}</span>
                <span className="pack-meta">
                  {pack.clasesPorSemana} clase{pack.clasesPorSemana > 1 ? 's' : ''}/sem · {formatCurrency(pack.precio)}
                </span>
              </div>
              <div className="pack-card-actions">
                <button
                  onClick={() => handleEdit(pack)}
                  className="btn-icon-sm"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteClick(pack.id)}
                  className="btn-icon-sm danger"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </>
  )
}
