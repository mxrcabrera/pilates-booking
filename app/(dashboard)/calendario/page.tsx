'use client'

import { CalendarioClient } from './calendario-client'
import { PreferencesRequired } from '@/components/preferences-required'
import { PageLoading } from '@/components/ui/loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { CalendarioData, CalendarioDataCached, PreferencesIncompleteResponse } from '@/lib/types'

function parseCalendarioData(data: unknown): CalendarioData {
  const cached = data as CalendarioDataCached
  const clasesTransformadas = cached.clases.map(c => ({
    ...c,
    fecha: new Date(c.fecha)
  }))
  return {
    ...cached,
    clases: clasesTransformadas,
    data: clasesTransformadas
  }
}

export default function CalendarioPage() {
  const { data, error, isLoading } = usePageData<CalendarioData>({
    cacheKey: CACHE_KEYS.CALENDARIO,
    apiUrl: '/api/v1/clases',
    transform: parseCalendarioData
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

  if ((data as unknown as PreferencesIncompleteResponse)?.preferencesIncomplete) {
    return <PreferencesRequired missingFields={(data as unknown as PreferencesIncompleteResponse).missingFields} />
  }

  if (isLoading || !data) {
    return <PageLoading />
  }

  return (
    <div data-testid="calendario-page">
      <CalendarioClient
        clasesIniciales={data.clases}
        alumnos={data.alumnos}
        packs={data.packs}
        horarioMananaInicio={data.horarioMananaInicio}
        horarioMananaFin={data.horarioMananaFin}
        horarioTardeInicio={data.horarioTardeInicio}
        horarioTardeFin={data.horarioTardeFin}
        maxAlumnosPorClase={data.maxAlumnosPorClase}
        horasAnticipacionMinima={data.horasAnticipacionMinima}
        features={data.features}
      />
    </div>
  )
}
