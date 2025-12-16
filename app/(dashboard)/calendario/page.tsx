'use client'

import { CalendarioClient } from './calendario-client'
import { PreferencesRequired } from '@/components/preferences-required'
import { PageLoading } from '@/components/page-loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { Clase, ClaseAPI, CalendarioData, CalendarioDataCached } from '@/lib/types'

function parseCalendarioData(cached: CalendarioDataCached): CalendarioData {
  return {
    ...cached,
    clases: cached.clases.map(c => ({
      ...c,
      fecha: new Date(c.fecha)
    }))
  }
}

export default function CalendarioPage() {
  const { data, error, isLoading } = usePageData<CalendarioData>({
    cacheKey: CACHE_KEYS.CALENDARIO,
    apiUrl: '/api/clases',
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

  if ((data as any)?.preferencesIncomplete) {
    return <PreferencesRequired missingFields={(data as any).missingFields} />
  }

  if (isLoading || !data) {
    return <PageLoading />
  }

  return (
    <CalendarioClient
      clasesIniciales={data.clases}
      alumnos={data.alumnos}
      currentUserId={data.currentUserId}
      horarioMananaInicio={data.horarioMananaInicio}
      horarioMananaFin={data.horarioMananaFin}
      horarioTardeInicio={data.horarioTardeInicio}
      horarioTardeFin={data.horarioTardeFin}
    />
  )
}
