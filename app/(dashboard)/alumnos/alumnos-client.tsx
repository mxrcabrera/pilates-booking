'use client'

import { useState } from 'react'
import { Search, Plus, Grid, List } from 'lucide-react'
import { AlumnoCard } from './alumno-card'
import { AlumnoDialog } from './alumno-dialog'
import { AlumnoDetailSheet } from './alumno-detail-sheet'
import { Users } from 'lucide-react'

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

export function AlumnosClient({ alumnos, packs }: { alumnos: Alumno[], packs: Pack[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null)
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const filteredAlumnos = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activos = alumnos.filter(a => a.estaActivo).length
  const inactivos = alumnos.filter(a => !a.estaActivo).length

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
    setEditingAlumno(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Alumnos</h1>
          <p className="page-subtitle">{activos} activos · {inactivos} inactivos</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus size={20} />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      <div className="content-card">
        <div className="alumnos-toolbar">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar alumno..."
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

        {filteredAlumnos.length === 0 ? (
          <div className="empty-state">
            <Users size={48} strokeWidth={1} />
            <p>{searchTerm ? 'No se encontraron alumnos' : 'No tenés alumnos registrados'}</p>
            {!searchTerm && (
              <>
                <p className="empty-subtitle">Agregá tu primer alumno para comenzar</p>
                <button onClick={handleNew} className="btn-outline">
                  Agregar Alumno
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'alumnos-grid' : 'alumnos-list'}>
            {filteredAlumnos.map(alumno => (
              <AlumnoCard
                key={alumno.id}
                alumno={alumno}
                onEdit={() => handleEdit(alumno)}
                onView={() => handleView(alumno)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      <AlumnoDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingAlumno(null)
        }}
        alumno={editingAlumno}
        packs={packs}
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
    </div>
  )
}