'use client'

import { useEffect, useState } from 'react'
import { PagosClient } from './pagos-client'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'
import type { PagosData } from '@/lib/types'

export default function PagosPage() {
  const [data, setData] = useState<PagosData | null>(() =>
    getCachedData<PagosData>(CACHE_KEYS.PAGOS)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) return

    fetch('/api/pagos')
      .then(res => res.json())
      .then(responseData => {
        if (responseData.error) {
          setError(responseData.error)
        } else {
          setCachedData(CACHE_KEYS.PAGOS, responseData)
          setData(responseData)
        }
      })
      .catch(err => setError(err.message))
  }, [data])

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card page-error-state">
          <p className="page-error-text">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <PageLoading />
  }

  return <PagosClient pagos={data.pagos} alumnos={data.alumnos} />
}
