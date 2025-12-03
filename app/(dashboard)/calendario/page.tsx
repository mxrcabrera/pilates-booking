'use client'

import { useEffect, useState } from 'react'
import { CalendarioClient } from './calendario-client'
import { PreferencesRequired } from '@/components/preferences-required'
import CalendarioLoading from './loading'

type ClaseAPI = {
  id: string
  fecha: string
  horaInicio: string
  horaRecurrente: string | null
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  diasSemana: number[]
  profesorId: string
  alumnoId: string | null
  alumno: { id: string; nombre: string } | null
  profesor: { id: string; nombre: string }
}

type Clase = Omit<ClaseAPI, 'fecha'> & { fecha: Date }

type Alumno = {
  id: string
  nombre: string
}

type CalendarioData = {
  clases: Clase[]
  alumnos: Alumno[]
  currentUserId: string
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
}

export default function CalendarioPage() {
  const [data, setData] = useState<CalendarioData | null>(null)
  const [preferencesIncomplete, setPreferencesIncomplete] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clases')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else if (data.preferencesIncomplete) {
          setPreferencesIncomplete(data.missingFields)
        } else {
          // Parse dates back from API strings to Date objects
          const clasesConFechas: Clase[] = data.clases.map((c: ClaseAPI) => ({
            ...c,
            fecha: new Date(c.fecha)
          }))
          setData({ ...data, clases: clasesConFechas })
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

  if (preferencesIncomplete) {
    return <PreferencesRequired missingFields={preferencesIncomplete} />
  }

  if (!data) {
    return <CalendarioLoading />
  }

  return (
    <CalendarioClient
      clasesIniciales={data.clases}
      alumnos={data.alumnos}
      currentUserId={data.currentUserId}
      horarioMananaInicio={data.horarioMananaInicio}
      horarioMananaFin={data.horarioMananaFin}
      horarioTardeInicio={data.horarioTardeInicio}
      horarioTardeFin={data.horarioTardeFin}
    />
  )
}
