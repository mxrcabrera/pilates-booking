'use client'

import { PagosClient } from './pagos-client'
import { PageLoading } from '@/components/ui/loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { PagosData } from '@/lib/types'

export default function PagosPage() {
  const { data, error, isLoading } = usePageData<PagosData>({
    cacheKey: CACHE_KEYS.PAGOS,
    apiUrl: '/api/pagos'
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

  return <PagosClient pagos={data.pagos} alumnos={data.alumnos} />
}
