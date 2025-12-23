'use client'

import { useSession } from '@/lib/use-session'
import { AlumnoNav } from './alumno-nav'

export default function AlumnoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Requerir login, redirige a /login si no hay sesión
  const { user, loading } = useSession({ required: true, redirectTo: '/login?callbackUrl=/alumno/reservar' })

  // Mientras carga o no hay usuario, NO mostrar nada (solo loading)
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
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
