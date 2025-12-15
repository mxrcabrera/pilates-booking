'use client'

import { useEffect, useState } from 'react'
import { CalendarioClient } from './calendario-client'
import { PreferencesRequired } from '@/components/preferences-required'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'
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
  const [data, setData] = useState<CalendarioData | null>(() => {
    const cached = getCachedData<CalendarioDataCached>(CACHE_KEYS.CALENDARIO)
    return cached ? parseCalendarioData(cached) : null
  })
  const [preferencesIncomplete, setPreferencesIncomplete] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) return

    fetch('/api/clases')
      .then(res => res.json())
      .then(responseData => {
        if (responseData.error) {
          setError(responseData.error)
        } else if (responseData.preferencesIncomplete) {
          setPreferencesIncomplete(responseData.missingFields)
        } else {
          // Cache the raw API response (with string dates)
          setCachedData(CACHE_KEYS.CALENDARIO, responseData)
          // Parse dates for component use
          const clasesConFechas: Clase[] = responseData.clases.map((c: ClaseAPI) => ({
            ...c,
            fecha: new Date(c.fecha)
          }))
          setData({ ...responseData, clases: clasesConFechas })
        }
      })
      .catch(err => setError(err.message))
  }, [data])

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,100,100,0.9)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (preferencesIncomplete) {
    return <PreferencesRequired missingFields={preferencesIncomplete} />
  }

  if (!data) {
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
