'use client'

import { useState, useEffect } from 'react'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'
import { ReservarClient } from './reservar-client'
import { useSession } from '@/lib/use-session'

export default function AlumnoReservarPage() {
  const { user, loading: sessionLoading } = useSession({ required: true, redirectTo: '/login?callbackUrl=/alumno/reservar' })
  const [estudioId, setEstudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlumnoData() {
      if (!user) return

      try {
        const res = await fetch('/api/v1/alumno/dashboard')
        const data = await res.json()
        if (data.error) return

        // Get estudioId from alumno data
        const alumnoRes = await fetch('/api/v1/alumno/perfil')
        const alumnoData = await alumnoRes.json()
        if (alumnoData.alumno?.estudioId) {
          setEstudioId(alumnoData.alumno.estudioId)
        }
      } catch (error) {
        console.error('Error fetching alumno data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAlumnoData()
    }
  }, [user])

  if (sessionLoading || loading) return <PageLoading />

  if (!estudioId) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Reservar Clase</h1>
          </div>
        </div>
        <EmptyState
          icon={<Calendar size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
          title="No se pudo determinar el estudio"
          description="Contacta a tu profesor para verificar tu vinculación"
        />
      </div>
    )
  }

  return <ReservarClient estudioId={estudioId} />
}
