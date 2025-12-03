'use client'

import { useEffect, useState } from 'react'
import { AlumnosClient } from './alumnos-client'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'

type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  genero: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
  _count: {
    clases: number
    pagos: number
  }
}

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

type AlumnosData = {
  alumnos: Alumno[]
  packs: Pack[]
  precioPorClase: string
}

export default function AlumnosPage() {
  const [data, setData] = useState<AlumnosData | null>(() =>
    getCachedData<AlumnosData>(CACHE_KEYS.ALUMNOS)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) return

    fetch('/api/alumnos')
      .then(res => res.json())
      .then(responseData => {
        if (responseData.error) {
          setError(responseData.error)
        } else {
          setCachedData(CACHE_KEYS.ALUMNOS, responseData)
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

  return <AlumnosClient alumnos={data.alumnos} packs={data.packs} precioPorClase={data.precioPorClase} />
}
