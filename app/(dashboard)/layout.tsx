'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav } from './dashboard/dashboard-nav'

type User = {
  id: string
  nombre: string
  email: string
}

// Cache del usuario en memoria del cliente
let cachedUser: User | null = null

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)

  useEffect(() => {
    // Si ya tenemos el usuario en cache, no hacer fetch
    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
      return
    }

    // Fetch del usuario actual
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          cachedUser = data.user
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  // Mostrar nada mientras carga (el contenido de la página tiene su propio loading)
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="dashboard-nav" style={{ height: '64px' }} />
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profesor={user} />
      <main>{children}</main>
    </div>
  )
}
