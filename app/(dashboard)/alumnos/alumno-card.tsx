'use client'

import { MoreVertical, Edit2, Trash2, UserX, UserCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toggleAlumnoStatusAPI, deleteAlumnoAPI } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
  _count: {
    clases: number
    pagos: number
  }
}

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

const PACK_LABELS: Record<string, string> = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
}

export function AlumnoCard({
  alumno,
  packs,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  viewMode = 'list'
}: {
  alumno: Alumno
  packs: Pack[]
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  onToggleStatus: () => void
  viewMode?: 'list' | 'grid'
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Obtener label del pack
  const getPackLabel = () => {
    if (PACK_LABELS[alumno.packType]) {
      return PACK_LABELS[alumno.packType]
    }
    // Si es pack personalizado (pack_{uuid})
    if (alumno.packType.startsWith('pack_')) {
      const packId = alumno.packType.replace('pack_', '')
      const pack = packs.find(p => p.id === packId)
      if (pack) return pack.nombre
    }
    return alumno.packType
  }

  // Obtener clases del pack
  const getPackClases = () => {
    if (alumno.packType.startsWith('pack_')) {
      const packId = alumno.packType.replace('pack_', '')
      const pack = packs.find(p => p.id === packId)
      if (pack) return pack.clasesPorSemana
    }
    return null
  }

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

  const handleToggleStatus = () => {
    setShowMenu(false)
    onToggleStatus()
  }

  const handleDelete = () => {
    setShowMenu(false)
    onDelete()
  }

  const getClasesDisplay = () => {
    if (alumno.packType === 'mensual' && alumno.clasesPorMes) {
      return `${alumno.clasesPorMes}/mes`
    }
    const packClases = getPackClases()
    if (packClases) {
      return `${packClases}/sem`
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
          className={`alumno-list-item-final ${showMenu ? 'menu-active' : ''}`}
          onClick={() => !showMenu && onView()}
        >
          <div className="alumno-list-top-row">
            <h3>{alumno.nombre}</h3>
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
          
          <div className="alumno-list-bottom-row">
            <div className="alumno-list-info-row">
              <span className="pack-label-new">{getPackLabel()}</span>
              {getClasesDisplay() && (
                <>
                  <span className="separator-dot">•</span>
                  <span className="clases-mes-new">{getClasesDisplay()}</span>
                </>
              )}
            </div>
            
            <span className={`status-badge ${alumno.estaActivo ? 'active' : 'inactive'}`}>
              {alumno.estaActivo ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          
          {showMenu && (
            <div ref={dropdownRef} className="dropdown-menu-fixed">
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

  // Vista GRID (igual)
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
              {alumno.estaActivo ? 'Activo' : 'Inactivo'}
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
            {getClasesDisplay() && (
              <span className="pack-detail">{getClasesDisplay()}</span>
            )}
            <span className="pack-price">${alumno.precio}</span>
          </div>
        </div>
      </div>
    </>
  )
}