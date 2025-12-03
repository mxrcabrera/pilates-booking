'use client'

import { useEffect, useState } from 'react'
import { ConfiguracionClient } from './configuracion-client'
import ConfiguracionLoading from './loading'

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
  const [data, setData] = useState<ConfigData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/configuracion')
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
    return <ConfiguracionLoading />
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
