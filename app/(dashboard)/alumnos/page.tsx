'use client'

import { AlumnosClient } from './alumnos-client'
import { PageLoading } from '@/components/ui/loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { AlumnosData } from '@/lib/types'

export default function AlumnosPage() {
  const { data, error, isLoading } = usePageData<AlumnosData>({
    cacheKey: CACHE_KEYS.ALUMNOS,
    apiUrl: '/api/v1/alumnos'
  })

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card page-error-state">
          <p className="page-error-text">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return <PageLoading />
  }

  return <AlumnosClient alumnos={data.alumnos} packs={data.packs} precioPorClase={data.precioPorClase} planInfo={data.planInfo} features={data.features} />
}
