'use client'

import { Calendar, Users, DollarSign, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'
import { PageLoading } from '@/components/page-loading'
import { EmptyState } from '@/components/empty-state'
import { usePageData } from '@/lib/use-page-data'
import type { DashboardData } from '@/lib/types'

const CACHE_KEY = 'dashboard-data'

export default function DashboardPage() {
  const { data, error, isLoading } = usePageData<DashboardData>({
    cacheKey: CACHE_KEY,
    apiUrl: '/api/dashboard'
  })

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,100,100,0.9)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return <PageLoading />
  }

  // Usuario nuevo sin datos
  if (data.totalAlumnos === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Bienvenido</h1>
            <p className="date-text">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        <div className="agenda-card">
          <EmptyState
            icon={<Sparkles size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Empezá a usar tu estudio"
            description="Configurá tus horarios, agregá alumnos y comenzá a gestionar tus clases"
            actionLabel="Agregar primer alumno"
            actionHref="/alumnos"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido</h1>
          <p className="date-text">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Alumnos Activos</p>
            <p className="stat-value">{data.totalAlumnos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Clases Hoy</p>
            <p className="stat-value">{data.clasesHoy.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pagos Pendientes</p>
            <p className="stat-value">{data.pagosVencidos}</p>
          </div>
        </div>
      </div>

      <div className="agenda-card">
        {data.clasesHoy.length > 0 ? (
          <DashboardClient
            clasesHoy={data.clasesHoy}
            totalAlumnos={data.totalAlumnos}
            pagosVencidos={data.pagosVencidos}
          />
        ) : (
          <EmptyState
            icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Sin clases hoy"
            description="No tenés clases programadas para hoy. Disfrutá tu día libre"
          />
        )}
      </div>
    </div>
  )
}
