'use client'

import { useRequireRole } from '@/lib/use-session'
import { DashboardNav } from './dashboard/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useRequireRole(['PROFESOR'], '/alumno')

  // Mostrar loading placeholder mientras carga
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="dashboard-nav" style={{ height: '64px' }} />
        <main>{children}</main>
      </div>
    )
  }

  const features = user.features as { multiUsuarios?: boolean; reportesBasicos?: boolean } | undefined

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profesor={user} features={features} />
      <main style={{ paddingTop: '5rem' }}>{children}</main>
    </div>
  )
}
