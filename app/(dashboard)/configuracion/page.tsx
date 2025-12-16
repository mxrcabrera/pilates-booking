'use client'

import { ConfiguracionClient } from './configuracion-client'
import { PageLoading } from '@/components/page-loading'
import { usePageData } from '@/lib/use-page-data'
import { CACHE_KEYS } from '@/lib/client-cache'
import type { ConfigData } from '@/lib/types'

export default function ConfiguracionPage() {
  const { data, error, isLoading } = usePageData<ConfigData>({
    cacheKey: CACHE_KEYS.CONFIGURACION,
    apiUrl: '/api/configuracion'
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="page-subtitle">Configurá tus días y horarios de atención</p>
        </div>
      </div>

      <ConfiguracionClient
        profesor={data.profesor}
        horarios={data.horarios}
        packs={data.packs}
      />
    </div>
  )
}
