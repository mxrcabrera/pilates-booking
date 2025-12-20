'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'
import { PageLoading } from '@/components/page-loading'
import { EmptyState } from '@/components/empty-state'
import { SetupWizard } from '@/components/setup-wizard'
import { Calendar } from 'lucide-react'
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

  // Verificar si el usuario necesita completar el setup
  const needsSetup = data.setupStatus && (
    !data.setupStatus.hasHorarios ||
    !data.setupStatus.hasPacks ||
    !data.setupStatus.hasAlumnos
  )

  // Usuario nuevo sin completar setup
  if (needsSetup) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="date-text">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        <SetupWizard
          hasHorarios={data.setupStatus.hasHorarios}
          hasPacks={data.setupStatus.hasPacks}
          hasAlumnos={data.setupStatus.hasAlumnos}
          userName={data.setupStatus.userName || undefined}
        />

        {data.clasesHoy.length > 0 && (
          <DashboardClient
            clasesHoy={data.clasesHoy}
            totalAlumnos={data.totalAlumnos}
            horarioTardeInicio={data.horarioTardeInicio}
            maxAlumnosPorClase={data.maxAlumnosPorClase}
            siguienteClase={data.siguienteClase}
          />
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Hoy</h1>
          <p className="date-text">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {data.clasesHoy.length > 0 ? (
        <DashboardClient
          clasesHoy={data.clasesHoy}
          totalAlumnos={data.totalAlumnos}
          horarioTardeInicio={data.horarioTardeInicio}
          maxAlumnosPorClase={data.maxAlumnosPorClase}
          siguienteClase={data.siguienteClase}
        />
      ) : (
        <div className="agenda-card">
          <EmptyState
            icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Sin clases hoy"
            description="No tenés clases programadas para hoy. Disfrutá tu día libre"
          />
        </div>
      )}
    </div>
  )
}
