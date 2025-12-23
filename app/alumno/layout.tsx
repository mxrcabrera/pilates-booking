'use client'

import { useRequireRole } from '@/lib/use-session'
import { AlumnoNav } from './alumno-nav'

export default function AlumnoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useRequireRole(['ALUMNO'], '/dashboard')

  // Mostrar loading placeholder mientras carga
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="alumno-nav" style={{ height: '64px' }} />
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AlumnoNav user={user} />
      <main style={{ paddingTop: '5rem' }}>{children}</main>
    </div>
  )
}
