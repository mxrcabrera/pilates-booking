'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlumnoNav } from './alumno-nav'

type User = {
  id: string
  nombre: string
  email: string
  role: string
}

let cachedUser: User | null = null

export default function AlumnoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
      return
    }

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
          if (data.user.role !== 'ALUMNO') {
            router.push('/dashboard')
            return
          }
          cachedUser = data.user
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

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
