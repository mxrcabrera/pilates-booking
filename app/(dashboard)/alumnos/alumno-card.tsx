'use client'

import { MoreVertical, Edit2, Trash2, UserX, UserCheck, Eye } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { Alumno } from '@/lib/types'
import { PACK_LABELS } from '@/lib/constants'

export function AlumnoCard({
  alumno,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  viewMode = 'list'
}: {
  alumno: Alumno
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  onToggleStatus: () => void
  viewMode?: 'list' | 'grid'
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getPackLabel = () => PACK_LABELS[alumno.packType] || alumno.packType

  // Status con género
  const getStatusText = () => {
    if (alumno.genero === 'M') {
      return alumno.estaActivo ? 'Activo' : 'Inactivo'
    }
    return alumno.estaActivo ? 'Activa' : 'Inactiva'
  }

  // Días para próximo pago
  const getDiasPago = () => {
    if (!alumno.estaActivo) return null
    if (!alumno.proximoPagoVencimiento) return null

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(alumno.proximoPagoVencimiento)
    vencimiento.setHours(0, 0, 0, 0)
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (dias < 0) {
      return { texto: `${Math.abs(dias)}d atraso`, clase: 'vencido' }
    } else if (dias === 0) {
      return { texto: 'Hoy', clase: 'hoy' }
    } else if (dias <= 7) {
      return { texto: `${dias}d`, clase: 'proximo' }
    }
    return { texto: `${dias}d`, clase: 'tranquilo' }
  }

  const diasPago = getDiasPago()

  // Listener global para cerrar menu
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      if (
        menuButtonRef.current && !menuButtonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // Cerrar con ESC
  useEffect(() => {
    if (!showMenu) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [showMenu])

  const handleToggleStatus = () => {
    setShowMenu(false)
    onToggleStatus()
  }

  const handleDelete = () => {
    setShowMenu(false)
    onDelete()
  }

  // Vista LISTA
  if (viewMode === 'list') {
    return (
      <>
        {showMenu && (
          <div className="dropdown-overlay" onClick={() => setShowMenu(false)} />
        )}
        <div
          className={`alumno-list-item-final ${showMenu ? 'menu-active' : ''}`}
        >
          <div className="alumno-list-top-row">
            <div className="alumno-list-nombre">
              <h3>{alumno.nombre}</h3>
              {diasPago && (
                <span className={`dias-pago-badge ${diasPago.clase}`}>{diasPago.texto}</span>
              )}
            </div>
            <div className="alumno-list-actions">
              <span className={`status-badge ${alumno.estaActivo ? 'active' : 'inactive'}`}>
                {getStatusText()}
              </span>
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="menu-btn-top"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {showMenu && (
            <div ref={dropdownRef} className="dropdown-menu-fixed">
              <button onClick={() => { onView(); setShowMenu(false); }}>
                <Eye size={16} />
                <span>Ver detalle</span>
              </button>
              <button onClick={() => { onEdit(); setShowMenu(false); }}>
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
              <button onClick={handleToggleStatus}>
                {alumno.estaActivo ? <UserX size={16} /> : <UserCheck size={16} />}
                <span>{alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
              </button>
              <button onClick={handleDelete} className="danger">
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  // Vista GRID
  return (
    <>
      {showMenu && (
        <div className="dropdown-overlay" onClick={() => setShowMenu(false)} />
      )}
      <div className={`alumno-card ${showMenu ? 'menu-active' : ''}`}>
        <div className="alumno-header">
          <div className="alumno-avatar">
            {alumno.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="alumno-info">
            <h3>{alumno.nombre}</h3>
            <span className={`status-badge ${alumno.estaActivo ? 'active' : 'inactive'}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="alumno-menu">
            <button
              ref={menuButtonRef}
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="btn-icon-xs"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div ref={dropdownRef} className="dropdown-menu-fixed">
                <button onClick={() => { onView(); setShowMenu(false); }}>
                  <Eye size={16} />
                  <span>Ver detalle</span>
                </button>
                <button onClick={() => { onEdit(); setShowMenu(false); }}>
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
                <button onClick={handleToggleStatus}>
                  {alumno.estaActivo ? <UserX size={16} /> : <UserCheck size={16} />}
                  <span>{alumno.estaActivo ? 'Desactivar' : 'Activar'}</span>
                </button>
                <button onClick={handleDelete} className="danger">
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="alumno-details">
          <div className="detail-row">
            <span>{alumno.email}</span>
          </div>
          <div className="detail-row">
            <span>{alumno.telefono}</span>
          </div>
          <div className="pack-info">
            <span className="pack-badge">{getPackLabel()}</span>
          </div>
        </div>
      </div>
    </>
  )
}
