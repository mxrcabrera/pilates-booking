'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageLoading } from '@/components/ui/loading'
import { AlumnoSetupWizard } from './alumno-setup-wizard'
import { AlumnoDashboardClient } from './alumno-dashboard-client'
import { usePageData } from '@/lib/use-page-data'

function getGreeting(genero: string): string {
  return genero === 'F' ? 'Bienvenida' : genero === 'M' ? 'Bienvenido' : 'Bienvenido/a'
}

type AlumnoDashboardData = {
  user: {
    id: string
    nombre: string
    email: string
    telefono: string | null
    genero: string
  }
  setupStatus: {
    hasProfile: boolean
    hasProfesor: boolean
  }
  profesores: Array<{
    id: string
    nombre: string
  }>
  proximasClases: Array<{
    id: string
    fecha: string
    hora: string
    profesorNombre: string
  }>
}

export default function AlumnoDashboardPage() {
  const { data, error, isLoading } = usePageData<AlumnoDashboardData>({
    cacheKey: 'alumno-dashboard',
    apiUrl: '/api/alumno/dashboard'
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

  const needsSetup = data.setupStatus && (!data.setupStatus.hasProfile || !data.setupStatus.hasProfesor)

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>{needsSetup ? getGreeting(data.user.genero) : 'Mis Clases'}</h1>
          <p className="date-text">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {needsSetup ? (
        <AlumnoSetupWizard
          hasProfile={data.setupStatus.hasProfile}
          hasProfesor={data.setupStatus.hasProfesor}
          userName={data.user.nombre}
        />
      ) : (
        <AlumnoDashboardClient
          profesores={data.profesores}
          proximasClases={data.proximasClases}
        />
      )}
    </div>
  )
}
