'use client'

import { useState } from 'react'
import { Search, Plus, Grid, List, Users, Pencil, Trash2, UserX, UserCheck, X, Crown, Download, Lock } from 'lucide-react'
import { AlumnoCard } from './alumno-card'
import { AlumnoDialog } from './alumno-dialog'
import { AlumnoDetailSheet } from './alumno-detail-sheet'
import { toggleAlumnoStatusAPI, deleteAlumnoAPI, bulkDeleteAlumnosAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { exportToCSV, ALUMNOS_COLUMNS } from '@/lib/export'
import type { Alumno, Pack, PlanInfo, AlumnosFeatures } from '@/lib/types'
import { PLAN_NAMES } from '@/lib/constants'

type FilterType = 'todos' | 'activos' | 'inactivos'

export function AlumnosClient({ alumnos: initialAlumnos, packs, precioPorClase, planInfo, features }: { alumnos: Alumno[], packs: Pack[], precioPorClase: string, planInfo: PlanInfo, features: AlumnosFeatures }) {
  const { showSuccess, showError } = useToast()
  const [alumnos, setAlumnos] = useState(initialAlumnos)
  const [currentPlanInfo, setCurrentPlanInfo] = useState(planInfo)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('activos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null)
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; alumno: Alumno | null }>({
    isOpen: false,
    alumno: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // Modo selección
  const [selectedAlumnos, setSelectedAlumnos] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  const selectionMode = selectedAlumnos.size > 0

  const activos = alumnos.filter(a => a.estaActivo).length
  const inactivos = alumnos.filter(a => !a.estaActivo).length

  // Filtrar por búsqueda y estado
  const filteredAlumnos = alumnos.filter(a => {
    const matchesSearch = a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'todos' ||
      (filter === 'activos' && a.estaActivo) ||
      (filter === 'inactivos' && !a.estaActivo)
    return matchesSearch && matchesFilter
  })

  const handleEdit = (alumno: Alumno) => {
    setEditingAlumno(alumno)
    setIsDialogOpen(true)
    setIsSheetOpen(false)
  }

  const handleView = (alumno: Alumno) => {
    setSelectedAlumno(alumno)
    setIsSheetOpen(true)
  }

  const handleNew = () => {
    if (!currentPlanInfo.canAddMore) {
      showError(`Alcanzaste el límite de ${currentPlanInfo.maxAlumnos} alumnos en el plan ${PLAN_NAMES[currentPlanInfo.plan]}. Actualizá tu plan para agregar más.`)
      return
    }
    setEditingAlumno(null)
    setIsDialogOpen(true)
  }

  const handleAlumnoSuccess = (alumno: Alumno, isEdit: boolean) => {
    if (isEdit) {
      setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, ...alumno } : a))
    } else {
      setAlumnos(prev => [...prev, { ...alumno, _count: { clases: 0, pagos: 0 } }])
      setCurrentPlanInfo(prev => ({
        ...prev,
        currentAlumnos: prev.currentAlumnos + 1,
        canAddMore: prev.currentAlumnos + 1 < prev.maxAlumnos
      }))
    }
  }

  const handleToggleStatus = async (alumno: Alumno) => {
    setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, estaActivo: !a.estaActivo } : a))
    try {
      await toggleAlumnoStatusAPI(alumno.id)
      showSuccess(alumno.estaActivo ? 'Alumno desactivado' : 'Alumno activado')
    } catch (err) {
      setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, estaActivo: !a.estaActivo } : a))
      showError(getErrorMessage(err))
    }
  }

  const handleDeleteClick = (alumno: Alumno) => {
    setDeleteConfirm({ isOpen: true, alumno })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.alumno) return
    setIsDeleting(true)
    try {
      await deleteAlumnoAPI(deleteConfirm.alumno.id)
      setAlumnos(prev => prev.filter(a => a.id !== deleteConfirm.alumno?.id))
      setCurrentPlanInfo(prev => ({
        ...prev,
        currentAlumnos: Math.max(0, prev.currentAlumnos - 1),
        canAddMore: true
      }))
      showSuccess('Alumno eliminado')
      setDeleteConfirm({ isOpen: false, alumno: null })
      if (selectedAlumno?.id === deleteConfirm.alumno.id) {
        setIsSheetOpen(false)
        setSelectedAlumno(null)
      }
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  // Funciones de selección
  const toggleSelection = (id: string) => {
    setSelectedAlumnos(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedAlumnos(new Set())
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const idsToDelete = Array.from(selectedAlumnos)
      await bulkDeleteAlumnosAPI(idsToDelete)
      setAlumnos(prev => prev.filter(a => !selectedAlumnos.has(a.id)))
      setCurrentPlanInfo(prev => ({
        ...prev,
        currentAlumnos: Math.max(0, prev.currentAlumnos - idsToDelete.length),
        canAddMore: true
      }))
      showSuccess(`${idsToDelete.length} alumno(s) eliminado(s)`)
      setBulkDeleteConfirm(false)
      setSelectedAlumnos(new Set())
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkToggleStatus = async (activate: boolean) => {
    const idsToToggle = Array.from(selectedAlumnos)
    setAlumnos(prev => prev.map(a =>
      selectedAlumnos.has(a.id) ? { ...a, estaActivo: activate } : a
    ))
    try {
      await Promise.all(idsToToggle.map(id => {
        const alumno = alumnos.find(a => a.id === id)
        if (alumno && alumno.estaActivo !== activate) {
          return toggleAlumnoStatusAPI(id)
        }
        return Promise.resolve()
      }))
      showSuccess(`${idsToToggle.length} alumno(s) ${activate ? 'activado(s)' : 'desactivado(s)'}`)
      setSelectedAlumnos(new Set())
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const handleEditSelected = () => {
    const id = Array.from(selectedAlumnos)[0]
    const alumno = alumnos.find(a => a.id === id)
    if (alumno) {
      handleEdit(alumno)
      setSelectedAlumnos(new Set())
    }
  }

  const isNearLimit = currentPlanInfo.currentAlumnos >= currentPlanInfo.maxAlumnos - 2 && currentPlanInfo.currentAlumnos < currentPlanInfo.maxAlumnos
  const isAtLimit = !currentPlanInfo.canAddMore

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Alumnos</h1>
        </div>
        <button onClick={handleNew} className="btn-primary" disabled={isAtLimit}>
          <Plus size={20} />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      {/* Banner de límite de plan */}
      {isAtLimit && (
        <div className="plan-limit-banner danger">
          <Crown size={18} />
          <span>
            Alcanzaste el límite de {currentPlanInfo.maxAlumnos} alumnos del plan {PLAN_NAMES[currentPlanInfo.plan]}.{' '}
            <a href="/planes" className="plan-limit-link">Actualizá tu plan</a>
          </span>
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <div className="plan-limit-banner warning">
          <Crown size={18} />
          <span>
            Tenés {currentPlanInfo.currentAlumnos} de {currentPlanInfo.maxAlumnos} alumnos.{' '}
            <a href="/planes" className="plan-limit-link">Ver planes</a>
          </span>
        </div>
      )}

      {/* Buscador y vista */}
      <div className="pagos-toolbar">
        <div className="pagos-search">
          <Search size={16} className="pagos-search-icon" />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pagos-search-input"
          />
        </div>
        <div className="toolbar-actions">
          <button
            className={`toolbar-btn ${!features.exportarExcel ? 'btn-locked' : ''}`}
            onClick={() => {
              if (!features.exportarExcel) {
                showError(`Exportar está disponible desde el plan ${PLAN_NAMES['PRO']}`)
                return
              }
              const dataToExport = filteredAlumnos.map(a => ({
                nombre: a.nombre,
                email: a.email,
                telefono: a.telefono,
                genero: a.genero === 'F' ? 'Mujer' : 'Hombre',
                packType: a.packType,
                precio: a.precio,
                estaActivo: a.estaActivo ? 'Sí' : 'No',
                clasesEsteMes: a.clasesEsteMes
              }))
              exportToCSV(dataToExport, ALUMNOS_COLUMNS, `alumnos-${new Date().toISOString().split('T')[0]}`)
              showSuccess('Archivo exportado correctamente')
            }}
            title={features.exportarExcel ? 'Exportar a CSV' : `Disponible en plan ${PLAN_NAMES['PRO']}`}
          >
            {!features.exportarExcel ? <Lock size={16} /> : <Download size={16} />}
          </button>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <List size={18} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista tarjetas"
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="segmented-control pagos-segmented">
        <button
          className={`segmented-option ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
        >
          Todos
          <span className="segmented-count">{alumnos.length}</span>
        </button>
        <button
          className={`segmented-option ${filter === 'activos' ? 'active' : ''}`}
          onClick={() => setFilter('activos')}
        >
          Activos
          {activos > 0 && <span className="segmented-count success">{activos}</span>}
        </button>
        <button
          className={`segmented-option ${filter === 'inactivos' ? 'active' : ''}`}
          onClick={() => setFilter('inactivos')}
        >
          Inactivos
          {inactivos > 0 && <span className="segmented-count">{inactivos}</span>}
        </button>
      </div>

      {filteredAlumnos.length === 0 ? (
        searchTerm || filter !== 'todos' ? (
          <div className="empty-state">
            <Search size={48} strokeWidth={1} />
            <p>No se encontraron alumnos</p>
            <span className="empty-state-hint">
              {searchTerm && `No hay resultados para "${searchTerm}"`}
              {searchTerm && filter !== 'todos' && ' en '}
              {filter === 'activos' && 'alumnos activos'}
              {filter === 'inactivos' && 'alumnos inactivos'}
            </span>
          </div>
        ) : (
          <EmptyState
            icon={<Users size={36} className="empty-state-icon-primary" />}
            title="Sin alumnos todavía"
            description="Agregá tu primer alumno para empezar a gestionar tus clases"
            actionLabel="Nuevo Alumno"
            onAction={handleNew}
          />
        )
      ) : (
        <div className={viewMode === 'grid' ? 'alumnos-grid' : 'alumnos-list'}>
          {filteredAlumnos.map(alumno => (
            <AlumnoCard
              key={alumno.id}
              alumno={alumno}
              onEdit={() => handleEdit(alumno)}
              onView={() => handleView(alumno)}
              onDelete={() => handleDeleteClick(alumno)}
              onToggleStatus={() => handleToggleStatus(alumno)}
              viewMode={viewMode}
              selectionMode={selectionMode}
              isSelected={selectedAlumnos.has(alumno.id)}
              onToggleSelection={() => toggleSelection(alumno.id)}
            />
          ))}
        </div>
      )}

      {/* Barra de acciones flotante */}
      {selectionMode && (
        <div className="floating-action-bar">
          <div className="floating-action-bar-content">
            <button className="fab-close" onClick={clearSelection}>
              <X size={18} />
            </button>
            <span className="fab-count">{selectedAlumnos.size} seleccionado{selectedAlumnos.size > 1 ? 's' : ''}</span>

            <div className="fab-actions">
              {selectedAlumnos.size === 1 && (
                <button className="fab-btn" onClick={handleEditSelected} title="Editar">
                  <Pencil size={18} />
                </button>
              )}
              <button className="fab-btn" onClick={() => handleBulkToggleStatus(true)} title="Activar">
                <UserCheck size={18} />
              </button>
              <button className="fab-btn" onClick={() => handleBulkToggleStatus(false)} title="Desactivar">
                <UserX size={18} />
              </button>
              <button className="fab-btn danger" onClick={() => setBulkDeleteConfirm(true)} title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <AlumnoDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingAlumno(null)
        }}
        alumno={editingAlumno}
        onSuccess={handleAlumnoSuccess}
        packs={packs}
        precioPorClase={precioPorClase}
        canUseProrrateo={features.prorrateoAutomatico}
      />

      <AlumnoDetailSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false)
          setSelectedAlumno(null)
        }}
        alumno={selectedAlumno}
        onEdit={() => handleEdit(selectedAlumno!)}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, alumno: null })}
        onConfirm={handleDelete}
        title={`¿Eliminar a ${deleteConfirm.alumno?.nombre}?`}
        description="Esta acción no se puede deshacer. Se eliminarán también las clases asociadas."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`¿Eliminar ${selectedAlumnos.size} alumno(s)?`}
        description="Esta acción no se puede deshacer. Se eliminarán también las clases asociadas."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
