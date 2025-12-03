'use client'

import { useEffect, useState } from 'react'
import { AlumnosClient } from './alumnos-client'
import AlumnosLoading from './loading'

type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
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

export default function AlumnosPage() {
  const [data, setData] = useState<{ alumnos: Alumno[], packs: Pack[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/alumnos')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setData(data)
        }
      })
      .catch(err => setError(err.message))
  }, [])

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
    return <AlumnosLoading />
  }

  return <AlumnosClient alumnos={data.alumnos} packs={data.packs} />
}
