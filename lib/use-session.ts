'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type UserSession = {
  id: string
  nombre: string
  email: string
  role: string
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
  planName?: string
  inTrial?: boolean
  trialDaysLeft?: number
  features?: Record<string, unknown>
}

type UseSessionReturn = {
  user: UserSession | null
  loading: boolean
  error: string | null
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// Global session cache
let sessionCache: UserSession | null = null
let sessionPromise: Promise<UserSession | null> | null = null

// Function to clear cache (exported for external use)
export function clearSessionCache() {
  sessionCache = null
  sessionPromise = null
}

async function fetchSession(): Promise<UserSession | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store'
    })

    if (!res.ok) {
      clearSessionCache()
      return null
    }

    const data = await res.json()
    if (data?.user) {
      sessionCache = data.user
      return data.user
    }

    clearSessionCache()
    return null
  } catch {
    clearSessionCache()
    return null
  }
}

export function useSession(options?: { required?: boolean; redirectTo?: string }): UseSessionReturn {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(sessionCache)
  const [loading, setLoading] = useState(!sessionCache)
  const [error, setError] = useState<string | null>(null)

  const { required = true, redirectTo = '/login' } = options || {}

  const refresh = useCallback(async () => {
    setLoading(true)
    clearSessionCache()
    const session = await fetchSession()
    setUser(session)
    setLoading(false)

    if (!session && required) {
      router.push(redirectTo)
    }
  }, [router, required, redirectTo])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      clearSessionCache()
      setUser(null)
      router.push('/login')
    } catch {
      setError('Error al cerrar sesión')
    }
  }, [router])

  useEffect(() => {
    // If we already have cache, use it
    if (sessionCache) {
      setUser(sessionCache)
      setLoading(false)
      return
    }

    // If there's already a request in progress, wait for it
    if (sessionPromise) {
      sessionPromise.then(session => {
        setUser(session)
        setLoading(false)
        if (!session && required) {
          router.push(redirectTo)
        }
      })
      return
    }

    // Start new request
    sessionPromise = fetchSession()
    sessionPromise.then(session => {
      setUser(session)
      setLoading(false)
      sessionPromise = null

      if (!session && required) {
        router.push(redirectTo)
      }
    })
  }, [router, required, redirectTo])

  return { user, loading, error, logout, refresh }
}

// Hook to validate user role
export function useRequireRole(allowedRoles: string[], redirectTo?: string) {
  const { user, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (!allowedRoles.includes(user.role)) {
        const redirect = redirectTo || (user.role === 'ALUMNO' ? '/alumno' : '/dashboard')
        router.push(redirect)
      }
    }
  }, [user, loading, allowedRoles, redirectTo, router])

  return { user, loading, isAuthorized: user && allowedRoles.includes(user.role) }
}
