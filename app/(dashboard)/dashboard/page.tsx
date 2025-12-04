'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, DollarSign, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'
import { PageLoading } from '@/components/page-loading'
import { getCachedData, setCachedData } from '@/lib/client-cache'
import { EmptyState } from '@/components/empty-state'

const CACHE_KEY = 'dashboard-data'

type ClaseHoy = {
  id: string
  horaInicio: string
  estado: string
  esClasePrueba: boolean
  alumno: { nombre: string } | null
}

type DashboardData = {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  pagosVencidos: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(() =>
    getCachedData<DashboardData>(CACHE_KEY)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) return

    fetch('/api/dashboard')
      .then(res => res.json())
      .then(responseData => {
        if (responseData.error) {
          setError(responseData.error)
        } else if (responseData.redirect) {
          router.push(responseData.redirect)
        } else {
          setCachedData(CACHE_KEY, responseData)
          setData(responseData)
        }
      })
      .catch(err => setError(err.message))
  }, [data, router])

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

  // Usuario nuevo sin datos
  if (data.totalAlumnos === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Bienvenido</h1>
            <p className="date-text">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        <div className="agenda-card">
          <EmptyState
            icon={<Sparkles size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Empezá a usar tu estudio"
            description="Configurá tus horarios, agregá alumnos y comenzá a gestionar tus clases"
            actionLabel="Agregar primer alumno"
            actionHref="/alumnos"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido</h1>
          <p className="date-text">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Alumnos Activos</p>
            <p className="stat-value">{data.totalAlumnos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Clases Hoy</p>
            <p className="stat-value">{data.clasesHoy.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pagos Pendientes</p>
            <p className="stat-value">{data.pagosVencidos}</p>
          </div>
        </div>
      </div>

      <div className="agenda-card">
        {data.clasesHoy.length > 0 ? (
          <DashboardClient clasesHoy={data.clasesHoy} />
        ) : (
          <EmptyState
            icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
            title="Sin clases hoy"
            description="No tenés clases programadas para hoy. Disfrutá tu día libre"
          />
        )}
      </div>
    </div>
  )
}
