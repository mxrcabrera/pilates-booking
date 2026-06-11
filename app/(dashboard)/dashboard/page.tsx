'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { SetupWizard } from '@/components/setup-wizard'
import { ExcelImport } from '@/components/ExcelImport'
import { Calendar, Upload } from 'lucide-react'
import { usePageData } from '@/lib/use-page-data'
import { useMascot } from '@/lib/mascot-context'
import type { DashboardData } from '@/lib/types'
const CACHE_KEY = 'dashboard-data'

export default function DashboardPage() {
  const { data, error, isLoading } = usePageData<DashboardData>({
    cacheKey: CACHE_KEY,
    apiUrl: '/api/v1/dashboard'
  })
  
  const [showExcelImport, setShowExcelImport] = useState(false)
  const { setDashboardData } = useMascot()

  useEffect(() => {
    setDashboardData(data ?? null)
  }, [data, setDashboardData])

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

  const needsSetup = data.setupStatus && (
    !data.setupStatus.hasHorarios ||
    !data.setupStatus.hasPacks ||
    !data.setupStatus.hasAlumnos
  )

  if (needsSetup) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Hoy</h1>
            <p className="page-subtitle">
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
            features={data.features}
          />
        )}
      </div>
    )
  }

  return (
    <div className="page-container" data-testid="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Hoy</h1>
          <p className="page-subtitle">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn-outline"
            onClick={() => setShowExcelImport(!showExcelImport)}
          >
            <Upload size={18} />
            <span>Importar Excel</span>
          </button>
        </div>
      </div>

      <ExcelImport isOpen={showExcelImport} onClose={() => setShowExcelImport(false)} />

      {data.clasesHoy.length > 0 ? (
        <DashboardClient
          clasesHoy={data.clasesHoy}
          totalAlumnos={data.totalAlumnos}
          horarioTardeInicio={data.horarioTardeInicio}
          maxAlumnosPorClase={data.maxAlumnosPorClase}
          siguienteClase={data.siguienteClase}
          features={data.features}
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