'use client'

import { MoreVertical, Edit2, Trash2, UserX, UserCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toggleAlumnaStatus, deleteAlumna } from './actions'

type Alumna = {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActiva: boolean
  _count: {
    clases: number
    pagos: number
  }
}

const PACK_LABELS: Record<string, string> = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  'pack_4': 'Pack 4',
  'pack_8': 'Pack 8',
  'pack_12': 'Pack 12'
}

const PACK_CLASES: Record<string, number> = {
  'pack_4': 4,
  'pack_8': 8,
  'pack_12': 12
}

export function AlumnaCard({ 
  alumna, 
  onEdit, 
  onView,
  viewMode = 'list'
}: { 
  alumna: Alumna
  onEdit: () => void
  onView: () => void
  viewMode?: 'list' | 'grid'
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Listener global para cerrar menu
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      
      // Si el click NO es en el botón de menú NI en el dropdown, cerrar
      if (
        menuButtonRef.current && !menuButtonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowMenu(false)
      }
    }

    // Escuchar clicks en todo el documento
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

  const handleToggleStatus = async () => {
    setShowMenu(false)
    try {
      await toggleAlumnaStatus(alumna.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    setShowMenu(false)
    if (!confirm(`¿Estás segura de eliminar a ${alumna.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteAlumna(alumna.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getClasesDisplay = () => {
    if (alumna.packType === 'mensual' && alumna.clasesPorMes) {
      return `${alumna.clasesPorMes}/mes`
    }
    if (PACK_CLASES[alumna.packType]) {
      return `${PACK_CLASES[alumna.packType]}/sem`
    }
    return null
  }

  // Vista LISTA
  if (viewMode === 'list') {
    return (
      <>
        {showMenu && (
          <div className="dropdown-overlay" onClick={() => setShowMenu(false)} />
        )}
        <div 
          className={`alumna-list-item-final ${showMenu ? 'menu-active' : ''}`}
          onClick={() => !showMenu && onView()}
        >
          <div className="alumna-list-top-row">
            <h3>{alumna.nombre}</h3>
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
          
          <div className="alumna-list-bottom-row">
            <div className="alumna-list-info-row">
              <span className="pack-label-new">{PACK_LABELS[alumna.packType]}</span>
              {getClasesDisplay() && (
                <>
                  <span className="separator-dot">•</span>
                  <span className="clases-mes-new">{getClasesDisplay()}</span>
                </>
              )}
            </div>
            
            <span className={`status-badge ${alumna.estaActiva ? 'active' : 'inactive'}`}>
              {alumna.estaActiva ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          
          {showMenu && (
            <div ref={dropdownRef} className="dropdown-menu-fixed">
              <button onClick={() => { onEdit(); setShowMenu(false); }}>
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
              <button onClick={handleToggleStatus}>
                {alumna.estaActiva ? <UserX size={16} /> : <UserCheck size={16} />}
                <span>{alumna.estaActiva ? 'Desactivar' : 'Activar'}</span>
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

  // Vista GRID (igual)
  return (
    <>
      {showMenu && (
        <div className="dropdown-overlay" onClick={() => setShowMenu(false)} />
      )}
      <div className={`alumna-card ${showMenu ? 'menu-active' : ''}`}>
        <div className="alumna-header">
          <div className="alumna-avatar">
            {alumna.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="alumna-info">
            <h3>{alumna.nombre}</h3>
            <span className={`status-badge ${alumna.estaActiva ? 'active' : 'inactive'}`}>
              {alumna.estaActiva ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div className="alumna-menu">
            <button 
              ref={menuButtonRef}
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
              className="btn-icon-xs"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div ref={dropdownRef} className="dropdown-menu-fixed">
                <button onClick={() => { onEdit(); setShowMenu(false); }}>
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
                <button onClick={handleToggleStatus}>
                  {alumna.estaActiva ? <UserX size={16} /> : <UserCheck size={16} />}
                  <span>{alumna.estaActiva ? 'Desactivar' : 'Activar'}</span>
                </button>
                <button onClick={handleDelete} className="danger">
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="alumna-details">
          <div className="detail-row">
            <span>{alumna.email}</span>
          </div>
          <div className="detail-row">
            <span>{alumna.telefono}</span>
          </div>
          <div className="pack-info">
            <span className="pack-badge">{PACK_LABELS[alumna.packType]}</span>
            {getClasesDisplay() && (
              <span className="pack-detail">{getClasesDisplay()}</span>
            )}
            <span className="pack-price">${alumna.precio}</span>
          </div>
        </div>
      </div>
    </>
  )
}