'use client'

import { useState } from 'react'
import { Plus, Check, Clock, Trash2 } from 'lucide-react'
import { PagoDialog } from './pago-dialog'
import { useToast } from '@/components/ui/toast'
import { marcarPagadoAPI, marcarPendienteAPI, deletePagoAPI } from '@/lib/api'
import { invalidateCache, CACHE_KEYS } from '@/lib/client-cache'
import type { Pago, AlumnoPago } from '@/lib/types'

type FilterType = 'todos' | 'pendientes' | 'pagados'

export function PagosClient({
  pagos: initialPagos,
  alumnos
}: {
  pagos: Pago[]
  alumnos: AlumnoPago[]
}) {
  const { showSuccess, showError } = useToast()
  const [pagos, setPagos] = useState(initialPagos)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredPagos = pagos.filter(pago => {
    if (filter === 'pendientes') return pago.estado === 'pendiente'
    if (filter === 'pagados') return pago.estado === 'pagado'
    return true
  })

  const pendientes = pagos.filter(p => p.estado === 'pendiente').length
  const pagados = pagos.filter(p => p.estado === 'pagado').length

  async function handleToggleEstado(pago: Pago) {
    const nuevoEstado = pago.estado === 'pendiente' ? 'pagado' : 'pendiente'

    // Optimistic update
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
    } catch (err: any) {
      // Revert
      setPagos(prev => prev.map(p => p.id === pago.id ? pago : p))
      showError(err.message || 'Error al actualizar pago')
    }
  }

  async function handleDelete(pago: Pago) {
    if (!confirm('Eliminar este pago?')) return

    // Optimistic update
    setPagos(prev => prev.filter(p => p.id !== pago.id))

    try {
      await deletePagoAPI(pago.id)
      showSuccess('Pago eliminado')
      invalidateCache(CACHE_KEYS.PAGOS)
    } catch (err: any) {
      // Revert
      setPagos(prev => [...prev, pago])
      showError(err.message || 'Error al eliminar pago')
    }
  }

  function handlePagoCreated(pago: Pago) {
    setPagos(prev => [pago, ...prev])
    invalidateCache(CACHE_KEYS.PAGOS)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  function formatMonto(monto: string) {
    return `$${parseFloat(monto).toLocaleString('es-AR')}`
  }

  function isVencido(pago: Pago) {
    if (pago.estado === 'pagado') return false
    const vencimiento = new Date(pago.fechaVencimiento)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return vencimiento < hoy
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">
            {pendientes} pendiente{pendientes !== 1 ? 's' : ''} - {pagados} pagado{pagados !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setDialogOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Pago</span>
        </button>
      </div>

      <div className="filter-tabs pagos-filter-tabs">
        <button
          className={`filter-tab ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
        >
          Todos ({pagos.length})
        </button>
        <button
          className={`filter-tab ${filter === 'pendientes' ? 'active' : ''}`}
          onClick={() => setFilter('pendientes')}
        >
          Pendientes ({pendientes})
        </button>
        <button
          className={`filter-tab ${filter === 'pagados' ? 'active' : ''}`}
          onClick={() => setFilter('pagados')}
        >
          Pagados ({pagados})
        </button>
      </div>

      {filteredPagos.length === 0 ? (
        <div className="content-card pagos-empty-state">
          <p className="pagos-empty-text">
            {filter === 'todos'
              ? 'No hay pagos registrados'
              : filter === 'pendientes'
                ? 'No hay pagos pendientes'
                : 'No hay pagos completados'}
          </p>
        </div>
      ) : (
        <div className="pagos-list">
          {filteredPagos.map(pago => (
            <div
              key={pago.id}
              className={`pago-card ${pago.estado === 'pagado' ? 'pagado' : ''} ${isVencido(pago) ? 'vencido' : ''}`}
            >
              <div className="pago-main">
                <div className="pago-info">
                  <p className="pago-alumno">{pago.alumno.nombre}</p>
                  <p className="pago-mes">{pago.mesCorrespondiente}</p>
                </div>
                <div className="pago-monto">
                  {formatMonto(pago.monto)}
                </div>
              </div>

              <div className="pago-footer">
                <div className="pago-fecha">
                  {pago.estado === 'pagado' && pago.fechaPago ? (
                    <span className="fecha-pagado">
                      <Check size={14} />
                      Pagado {formatDate(pago.fechaPago)}
                    </span>
                  ) : (
                    <span className={`fecha-vencimiento ${isVencido(pago) ? 'vencido' : ''}`}>
                      <Clock size={14} />
                      Vence {formatDate(pago.fechaVencimiento)}
                    </span>
                  )}
                </div>

                <div className="pago-actions">
                  <button
                    className={`pago-btn ${pago.estado === 'pagado' ? 'undo' : 'confirm'}`}
                    onClick={() => handleToggleEstado(pago)}
                    title={pago.estado === 'pagado' ? 'Marcar pendiente' : 'Marcar pagado'}
                  >
                    {pago.estado === 'pagado' ? <Clock size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    className="pago-btn delete"
                    onClick={() => handleDelete(pago)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PagoDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        alumnos={alumnos}
        onSuccess={handlePagoCreated}
      />
    </div>
  )
}
