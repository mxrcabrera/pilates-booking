'use client'

import { useEffect, useState } from 'react'
import { ConfiguracionClient } from './configuracion-client'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'
import type { ConfigData } from '@/lib/types'

export default function ConfiguracionPage() {
  // Inicializar con datos cacheados si existen
  const [data, setData] = useState<ConfigData | null>(() =>
    getCachedData<ConfigData>(CACHE_KEYS.CONFIGURACION)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si ya tenemos datos cacheados, no hacer fetch
    if (data) return

    fetch('/api/configuracion')
      .then(res => res.json())
      .then(responseData => {
        if (responseData.error) {
          setError(responseData.error)
        } else {
          setCachedData(CACHE_KEYS.CONFIGURACION, responseData)
          setData(responseData)
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

  if (!data) {
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
