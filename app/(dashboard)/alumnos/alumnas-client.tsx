'use client'

import { useState } from 'react'
import { Search, Plus, Grid, List } from 'lucide-react'
import { AlumnaCard } from './alumna-card'
import { AlumnaDialog } from './alumna-dialog'
import { AlumnaDetailSheet } from './alumna-detail-sheet'
import { Users } from 'lucide-react'

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

export function AlumnasClient({ alumnas }: { alumnas: Alumna[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAlumna, setEditingAlumna] = useState<Alumna | null>(null)
  const [selectedAlumna, setSelectedAlumna] = useState<Alumna | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const filteredAlumnas = alumnas.filter(a =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activas = alumnas.filter(a => a.estaActiva).length
  const inactivas = alumnas.filter(a => !a.estaActiva).length

  const handleEdit = (alumna: Alumna) => {
    setEditingAlumna(alumna)
    setIsDialogOpen(true)
    setIsSheetOpen(false)
  }

  const handleView = (alumna: Alumna) => {
    setSelectedAlumna(alumna)
    setIsSheetOpen(true)
  }

  const handleNew = () => {
    setEditingAlumna(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Alumnas</h1>
          <p className="page-subtitle">{activas} activas · {inactivas} inactivas</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus size={20} />
          <span>Nueva Alumna</span>
        </button>
      </div>

      <div className="content-card">
        <div className="alumnas-toolbar">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar alumna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="view-toggle desktop-only">
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

        {filteredAlumnas.length === 0 ? (
          <div className="empty-state">
            <Users size={48} strokeWidth={1} />
            <p>{searchTerm ? 'No se encontraron alumnas' : 'No tenés alumnas registradas'}</p>
            {!searchTerm && (
              <>
                <p className="empty-subtitle">Agregá tu primera alumna para comenzar</p>
                <button onClick={handleNew} className="btn-outline">
                  Agregar Alumna
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'alumnas-grid' : 'alumnas-list'}>
            {filteredAlumnas.map(alumna => (
              <AlumnaCard
                key={alumna.id}
                alumna={alumna}
                onEdit={() => handleEdit(alumna)}
                onView={() => handleView(alumna)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      <AlumnaDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingAlumna(null)
        }}
        alumna={editingAlumna}
      />

      <AlumnaDetailSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false)
          setSelectedAlumna(null)
        }}
        alumna={selectedAlumna}
        onEdit={() => handleEdit(selectedAlumna!)}
      />
    </div>
  )
}