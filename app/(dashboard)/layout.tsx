'use client'

import { useRequireRole } from '@/lib/use-session'
import { usePathname } from 'next/navigation'
import { DashboardNav } from './dashboard/dashboard-nav'
import { Chatbot } from '@/components/Chatbot'
import { MascotProvider } from '@/lib/mascot-context'
import { MascotWidget } from '@/components/mascot-widget'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useRequireRole(['PROFESOR'], '/alumno')
  const pathname = usePathname()

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
    <MascotProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav profesor={user} features={features} />
        <main key={pathname} style={{ paddingTop: '5rem' }}>{children}</main>
        <MascotWidget />
        <Chatbot />
      </div>
    </MascotProvider>
  )
}
