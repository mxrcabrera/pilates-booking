'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Check, Clock, Trash2, DollarSign, Search, X, ChevronDown, Download, Lock } from 'lucide-react'
import { PagoDialog } from './pago-dialog'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { marcarPagadoAPI, marcarPendienteAPI, deletePagoAPI } from '@/lib/api'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import { formatMes, diasDiferencia } from '@/lib/dates'
import { exportToCSV, PAGOS_COLUMNS } from '@/lib/export'
import type { Pago, AlumnoPago, PagosFeatures } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { PLAN_NAMES } from '@/lib/constants'

type FilterType = 'todos' | 'pendientes' | 'pagados'

export function PagosClient({
  pagos: initialPagos,
  alumnos,
  features
}: {
  pagos: Pago[]
  alumnos: AlumnoPago[]
  features: PagosFeatures
}) {
  const { showSuccess, showError } = useToast()
  const [pagos, setPagos] = useState(initialPagos)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [mesFilter, setMesFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')

  // Obtener meses únicos de los pagos
  const mesesDisponibles = useMemo(() => {
    const meses = new Set<string>()
    pagos.forEach(p => meses.add(p.mesCorrespondiente))
    return Array.from(meses).sort().reverse()
  }, [pagos])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; pago: Pago | null }>({
    isOpen: false,
    pago: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)

  // Modo selección
  const [selectedPagos, setSelectedPagos] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  const selectionMode = selectedPagos.size > 0

  function getEstadoTexto(pago: Pago) {
    if (pago.estado === 'pagado' && pago.fechaPago) {
      const dias = diasDiferencia(pago.fechaPago)
      if (dias === 0) return 'Pagado hoy'
      if (dias === -1) return 'Pagado ayer'
      const fecha = new Date(pago.fechaPago)
      return `Pagado el ${fecha.getDate()}/${fecha.getMonth() + 1}`
    }

    const dias = diasDiferencia(pago.fechaVencimiento)
    if (dias < 0) {
      const diasVencido = Math.abs(dias)
      if (diasVencido === 1) return 'Venció ayer'
      return `Venció hace ${diasVencido} días`
    }
    if (dias === 0) return 'Vence hoy'
    if (dias === 1) return 'Vence mañana'
    if (dias <= 7) return `Vence en ${dias} días`
    const fecha = new Date(pago.fechaVencimiento)
    return `Vence el ${fecha.getDate()}/${fecha.getMonth() + 1}`
  }

  function getProgresoTexto(pago: Pago) {
    if (pago.tipoPago !== 'mensual' || !pago.clasesEsperadas) return null
    const completadas = pago.clasesCompletadas || 0
    const esperadas = pago.clasesEsperadas
    const restantes = esperadas - completadas
    if (restantes <= 0) return `${completadas}/${esperadas} clases (completo)`
    return `${completadas}/${esperadas} clases`
  }

  function isVencido(pago: Pago) {
    if (pago.estado === 'pagado') return false
    return diasDiferencia(pago.fechaVencimiento) < 0
  }

  function isProximoVencer(pago: Pago) {
    if (pago.estado === 'pagado') return false
    const dias = diasDiferencia(pago.fechaVencimiento)
    return dias >= 0 && dias <= 3
  }

  const processedPagos = useMemo(() => {
    let result = [...pagos]

    // Filtro por mes
    if (mesFilter !== 'todos') {
      result = result.filter(p => p.mesCorrespondiente === mesFilter)
    }

    if (filter === 'pendientes') {
      result = result.filter(p => p.estado === 'pendiente')
    } else if (filter === 'pagados') {
      result = result.filter(p => p.estado === 'pagado')
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      result = result.filter(p =>
        p.alumno.nombre.toLowerCase().includes(searchLower)
      )
    }

    result.sort((a, b) => {
      if (a.estado === 'pagado' && b.estado !== 'pagado') return 1
      if (a.estado !== 'pagado' && b.estado === 'pagado') return -1

      if (a.estado === 'pendiente' && b.estado === 'pendiente') {
        return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      }

      if (a.estado === 'pagado' && b.estado === 'pagado' && a.fechaPago && b.fechaPago) {
        return new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
      }

      return 0
    })

    return result
  }, [pagos, filter, mesFilter, search])

  const visiblePagos = processedPagos.slice(0, visibleCount)
  const hasMore = processedPagos.length > visibleCount
  const remaining = processedPagos.length - visibleCount

  const filterKey = `${filter}-${search}`
  useEffect(() => {
    setVisibleCount(10)
  }, [filterKey])

  const pendientes = pagos.filter(p => p.estado === 'pendiente').length
  const pagadosCount = pagos.filter(p => p.estado === 'pagado').length
  const totalPendiente = pagos
    .filter(p => p.estado === 'pendiente')
    .reduce((sum, p) => sum + parseFloat(p.monto), 0)

  async function handleToggleEstado(pago: Pago) {
    const nuevoEstado = pago.estado === 'pendiente' ? 'pagado' : 'pendiente'

    setPagos(prev => prev.map(p =>
      p.id === pago.id
        ? { ...p, estado: nuevoEstado, fechaPago: nuevoEstado === 'pagado' ? new Date().toISOString() : null }
        : p
    ))

    try {
      if (nuevoEstado === 'pagado') {
        await marcarPagadoAPI(pago.id)
        showSuccess('Pago marcado como pagado')
      } else {
        await marcarPendienteAPI(pago.id)
        showSuccess('Pago marcado como pendiente')
      }
      invalidateCache(CACHE_KEYS.PAGOS)
    } catch (err) {
      setPagos(prev => prev.map(p => p.id === pago.id ? pago : p))
      showError(getErrorMessage(err) || 'Error al actualizar pago')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.pago) return
    const pago = deleteConfirm.pago
    setIsDeleting(true)

    setPagos(prev => prev.filter(p => p.id !== pago.id))
    setDeleteConfirm({ isOpen: false, pago: null })

    try {
      await deletePagoAPI(pago.id)
      showSuccess('Pago eliminado')
      invalidateCache(CACHE_KEYS.PAGOS)
    } catch (err) {
      setPagos(prev => [...prev, pago])
      showError(getErrorMessage(err) || 'Error al eliminar pago')
    } finally {
      setIsDeleting(false)
    }
  }

  function handlePagoCreated(pago: Pago) {
    setPagos(prev => [pago, ...prev])
    invalidateCache(CACHE_KEYS.PAGOS)
  }

  function formatMonto(monto: string | number) {
    const num = typeof monto === 'string' ? parseFloat(monto) : monto
    return num.toLocaleString('es-AR')
  }

  // Funciones de selección bulk
  const toggleSelection = (id: string) => {
    setSelectedPagos(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const idsToDelete = Array.from(selectedPagos)
      await Promise.all(idsToDelete.map(id => deletePagoAPI(id)))
      setPagos(prev => prev.filter(p => !selectedPagos.has(p.id)))
      showSuccess(`${idsToDelete.length} pago(s) eliminado(s)`)
      setBulkDeleteConfirm(false)
      setSelectedPagos(new Set())
      invalidateCache(CACHE_KEYS.PAGOS)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkMarcarPagado = async () => {
    const idsToMark = Array.from(selectedPagos)
    // Optimistic update
    setPagos(prev => prev.map(p =>
      selectedPagos.has(p.id) ? { ...p, estado: 'pagado' as const, fechaPago: new Date().toISOString() } : p
    ))
    try {
      await Promise.all(idsToMark.map(id => {
        const pago = pagos.find(p => p.id === id)
        if (pago && pago.estado === 'pendiente') {
          return marcarPagadoAPI(id)
        }
        return Promise.resolve()
      }))
      showSuccess(`${idsToMark.length} pago(s) marcado(s) como pagado`)
      setSelectedPagos(new Set())
      invalidateCache(CACHE_KEYS.PAGOS)
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagos</h1>
          {totalPendiente > 0 && (
            <p className="page-subtitle pagos-total-pendiente">
              <DollarSign size={14} />
              {formatMonto(totalPendiente)} pendiente
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setDialogOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Pago</span>
        </button>
      </div>

      {/* Buscador y filtro de mes */}
      <div className="pagos-toolbar">
        <div className="pagos-search">
          <Search size={16} className="pagos-search-icon" />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              const dataToExport = processedPagos.map(p => ({
                alumnoNombre: p.alumno.nombre,
                monto: p.monto,
                estado: p.estado === 'pagado' ? 'Pagado' : 'Pendiente',
                fechaPago: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-AR') : '',
                fechaVencimiento: new Date(p.fechaVencimiento).toLocaleDateString('es-AR'),
                mesCorrespondiente: formatMes(p.mesCorrespondiente),
                tipoPago: p.tipoPago === 'mensual' ? 'Mensual' : 'Por clase'
              }))
              exportToCSV(dataToExport, PAGOS_COLUMNS, `pagos-${new Date().toISOString().split('T')[0]}`)
              showSuccess('Archivo exportado correctamente')
            }}
            title={features.exportarExcel ? 'Exportar a CSV' : `Disponible en plan ${PLAN_NAMES['PRO']}`}
          >
            {!features.exportarExcel ? <Lock size={16} /> : <Download size={16} />}
          </button>
          <div className="mes-filter">
            <select
              value={mesFilter}
              onChange={(e) => setMesFilter(e.target.value)}
              className="mes-filter-select"
            >
              <option value="todos">Todos los meses</option>
              {mesesDisponibles.map(mes => (
                <option key={mes} value={mes}>{formatMes(mes)}</option>
              ))}
            </select>
            <ChevronDown size={16} className="mes-filter-icon" />
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
          <span className="segmented-count">{pagos.length}</span>
        </button>
        <button
          className={`segmented-option ${filter === 'pendientes' ? 'active' : ''}`}
          onClick={() => setFilter('pendientes')}
        >
          Pendientes
          {pendientes > 0 && <span className="segmented-count warning">{pendientes}</span>}
        </button>
        <button
          className={`segmented-option ${filter === 'pagados' ? 'active' : ''}`}
          onClick={() => setFilter('pagados')}
        >
          Pagados
          {pagadosCount > 0 && <span className="segmented-count success">{pagadosCount}</span>}
        </button>
      </div>

      {/* Lista */}
      {processedPagos.length === 0 ? (
        <div className="pagos-empty">
          <div className="pagos-empty-icon">
            {search ? <Search size={32} /> : filter === 'pendientes' ? <Check size={32} /> : <DollarSign size={32} />}
          </div>
          <p className="pagos-empty-text">
            {search
              ? 'No se encontraron pagos'
              : filter === 'todos'
                ? 'No hay pagos registrados'
                : filter === 'pendientes'
                  ? 'No hay pagos pendientes'
                  : 'No hay pagos completados'}
          </p>
          {filter === 'todos' && !search && (
            <button className="btn-ghost btn-sm" onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              Registrar primer pago
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="pagos-list">
            {visiblePagos.map(pago => {
              const vencido = isVencido(pago)
              const proximo = isProximoVencer(pago)
              const esPagado = pago.estado === 'pagado'
              const estadoTexto = getEstadoTexto(pago)
              const progresoTexto = getProgresoTexto(pago)
              const clasesCompletas = pago.clasesEsperadas && pago.clasesCompletadas >= pago.clasesEsperadas
              const isSelected = selectedPagos.has(pago.id)

              return (
                <div
                  key={pago.id}
                  className={`pago-row ${esPagado ? 'pagado' : ''} ${vencido ? 'vencido' : ''} ${proximo ? 'proximo' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={selectionMode ? () => toggleSelection(pago.id) : undefined}
                >
                  {/* Checkbox en modo selección */}
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(pago.id)}
                      className="compact-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {/* Nombre y progreso */}
                  <div className="pago-info">
                    <span className="pago-nombre">{pago.alumno.nombre}</span>
                    {progresoTexto && (
                      <span className={`pago-mes ${clasesCompletas ? 'completo' : ''}`}>
                        {progresoTexto}
                      </span>
                    )}
                  </div>

                  {/* Estado descriptivo */}
                  <div className={`pago-estado ${esPagado ? 'pagado' : vencido ? 'vencido' : proximo ? 'proximo' : ''}`}>
                    {estadoTexto}
                  </div>

                  {/* Monto */}
                  <div className="pago-monto">
                    ${formatMonto(pago.monto)}
                  </div>

                  {/* Acciones - ocultas en modo selección */}
                  {!selectionMode && (
                    <div className="pago-actions">
                      <button
                        className={`pago-btn ${esPagado ? 'undo' : 'confirm'}`}
                        onClick={() => handleToggleEstado(pago)}
                        title={esPagado ? 'Marcar pendiente' : 'Marcar pagado'}
                      >
                        {esPagado ? <Clock size={16} /> : <Check size={16} />}
                      </button>
                      <button
                        className="pago-btn delete"
                        onClick={() => setDeleteConfirm({ isOpen: true, pago })}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {hasMore && (
            <button
              className="pagos-load-more"
              onClick={() => setVisibleCount(prev => prev + 10)}
            >
              Ver más ({remaining} restantes)
            </button>
          )}
        </>
      )}

      <PagoDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        alumnos={alumnos}
        onSuccess={handlePagoCreated}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, pago: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar este pago?"
        description={deleteConfirm.pago ? `Pago de ${deleteConfirm.pago.alumno.nombre} - ${formatMes(deleteConfirm.pago.mesCorrespondiente)}` : ''}
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`¿Eliminar ${selectedPagos.size} pago(s)?`}
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Floating action bar */}
      {selectionMode && (
        <div className="floating-action-bar">
          <div className="floating-action-bar-content">
            <button className="fab-close" onClick={() => setSelectedPagos(new Set())}>
              <X size={18} />
            </button>
            <span className="fab-count">{selectedPagos.size} seleccionado{selectedPagos.size > 1 ? 's' : ''}</span>

            <div className="fab-actions">
              <button className="fab-btn" onClick={handleBulkMarcarPagado} title="Marcar pagado">
                <Check size={18} />
              </button>
              <button className="fab-btn danger" onClick={() => setBulkDeleteConfirm(true)} title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
