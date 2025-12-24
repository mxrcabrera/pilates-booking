'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronRight, Clock, AlertCircle } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'

type Profesor = {
  id: string
  nombre: string
}

type HorarioDisponible = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
}

export default function AlumnoReservarPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [selectedProfesor, setSelectedProfesor] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  useEffect(() => {
    async function fetchProfesores() {
      try {
        const res = await fetch('/api/alumno/dashboard')
        const data = await res.json()

        if (data.error) {
          setError(data.error)
          return
        }

        setProfesores(data.profesores || [])
      } catch {
        setError('Error al cargar profesores')
      } finally {
        setLoading(false)
      }
    }

    fetchProfesores()
  }, [])

  async function handleSelectProfesor(profesorId: string) {
    setSelectedProfesor(profesorId)
    setLoadingHorarios(true)

    try {
      const res = await fetch(`/api/alumno/horarios?profesorId=${profesorId}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setHorarios(data.horarios || [])
    } catch {
      setError('Error al cargar horarios')
    } finally {
      setLoadingHorarios(false)
    }
  }

  if (loading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: 'rgba(255,100,100,0.9)', marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,100,100,0.9)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Reservar Clase</h1>
          <p>Elegí un profesor y horario para reservar</p>
        </div>
      </div>

      {profesores.length === 0 ? (
        <EmptyState
          icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
          title="No tenés profesores vinculados"
          description="Contactá a tu profesor para que te vincule como alumno"
        />
      ) : (
        <div className="reservar-flow">
          {/* Paso 1: Seleccionar profesor */}
          <section className="reservar-section">
            <h2>1. Elegí tu profesor</h2>
            <div className="profesores-list">
              {profesores.map(profesor => (
                <button
                  key={profesor.id}
                  className={`profesor-option ${selectedProfesor === profesor.id ? 'selected' : ''}`}
                  onClick={() => handleSelectProfesor(profesor.id)}
                >
                  <div className="profesor-avatar">
                    {profesor.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span>{profesor.nombre}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </section>

          {/* Paso 2: Ver horarios disponibles */}
          {selectedProfesor && (
            <section className="reservar-section">
              <h2>2. Horarios disponibles</h2>

              {loadingHorarios ? (
                <div className="loading-inline">Cargando horarios...</div>
              ) : horarios.length === 0 ? (
                <div className="empty-horarios">
                  <Clock size={24} />
                  <p>No hay horarios configurados</p>
                </div>
              ) : (
                <div className="horarios-grid">
                  {horarios.map(horario => (
                    <Link
                      key={horario.id}
                      href={`/alumno/reservar/${selectedProfesor}?dia=${horario.diaSemana}&hora=${horario.horaInicio}`}
                      className="horario-card"
                    >
                      <div className="horario-dia">{DIAS[horario.diaSemana]}</div>
                      <div className="horario-hora">
                        {horario.horaInicio} - {horario.horaFin}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
