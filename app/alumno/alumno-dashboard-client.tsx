'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

type Props = {
  profesores: Array<{
    id: string
    nombre: string
    slug: string
  }>
  proximasClases: Array<{
    id: string
    fecha: string
    hora: string
    profesorNombre: string
    profesorSlug: string
  }>
}

export function AlumnoDashboardClient({ profesores, proximasClases }: Props) {
  return (
    <div className="alumno-dashboard">
      {/* Próximas clases */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Próximas clases</h2>
          <Link href="/alumno/mis-clases" className="section-link">
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>

        {proximasClases.length > 0 ? (
          <div className="clases-list">
            {proximasClases.slice(0, 5).map(clase => (
              <div key={clase.id} className="clase-card">
                <div className="clase-fecha">
                  <Calendar size={16} />
                  <span>
                    {new Date(clase.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <span className="clase-hora">{clase.hora}</span>
                </div>
                <div className="clase-profesor">
                  con {clase.profesorNombre}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Sin clases próximas"
            description="Reservá una clase desde el portal de tu profesor"
          />
        )}
      </section>

      {/* Profesores */}
      {profesores.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Mis profesores</h2>
          </div>

          <div className="profesores-grid">
            {profesores.map(profesor => (
              <Link
                key={profesor.id}
                href={`/reservar/${profesor.slug}`}
                className="profesor-card"
              >
                <div className="profesor-avatar">
                  {profesor.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="profesor-nombre">{profesor.nombre}</span>
                <ChevronRight size={16} className="profesor-arrow" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA para buscar profesor */}
      <section className="dashboard-section">
        <Link href="/alumno/reservar" className="reservar-cta">
          <Search size={20} />
          <span>Buscar profesor y reservar clase</span>
          <ChevronRight size={20} />
        </Link>
      </section>
    </div>
  )
}
