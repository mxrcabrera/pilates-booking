'use client'

import { useEffect, useState } from 'react'
import { ConfiguracionClient } from './configuracion-client'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'

type Profesor = {
  id: string
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  precioPorClase: string
  hasGoogleAccount: boolean
}

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type ConfigData = {
  profesor: Profesor
  horarios: Horario[]
  packs: Pack[]
}

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
          <p className="page-subtitle">Administrá tu cuenta y horarios</p>
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
