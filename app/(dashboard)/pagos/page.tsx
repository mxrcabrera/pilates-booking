'use client'

import { PagosClient } from './pagos-client'
import { PageLoading } from '@/components/ui/loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { PagosData } from '@/lib/types'

export default function PagosPage() {
  const { data, error, isLoading } = usePageData<PagosData>({
    cacheKey: CACHE_KEYS.PAGOS,
    apiUrl: '/api/v1/pagos'
  })

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card page-error-state">
          <p className="page-error-text" role="alert">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return <PageLoading />
  }

  return (
    <div data-testid="pagos-page">
      <PagosClient pagos={data.pagos} alumnos={data.alumnos} features={data.features} />
    </div>
  )
}
