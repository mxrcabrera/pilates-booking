'use client'

import { usePageData } from '@/lib/use-page-data'
import { PageLoading } from '@/components/ui/loading'
import { ReportesClient } from './reportes-client'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import type { ReportesData } from '@/lib/types'

const CACHE_KEY = 'reportes-data'

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

export default function ReportesPage() {
  const { data, error, isLoading } = usePageData<ReportesData>({
    cacheKey: CACHE_KEY,
    apiUrl: '/api/v1/reportes'
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

  if (!data.canAccess) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Reportes</h1>
        </div>
        <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Lock size={48} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Función Premium</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Los reportes están disponibles desde el plan {PLAN_NAMES['PRO']}
          </p>
          <Link href="/planes" className="btn-primary">
            Ver planes
          </Link>
        </div>
      </div>
    )
  }

  return <ReportesClient data={data} />
}
