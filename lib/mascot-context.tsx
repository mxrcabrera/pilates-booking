'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type { DashboardData } from '@/lib/types'
import {
  deriveAppSignals,
  pathnameToScreenContext,
  resolveMascot,
  type MascotConfig,
  type ResolvedMascot,
} from '@/lib/mascot'

type MascotContextValue = {
  config: MascotConfig | null
  resolved: ResolvedMascot | null
  loading: boolean
  refresh: () => Promise<void>
  setDashboardData: (data: DashboardData | null) => void
}

const MascotCtx = createContext<MascotContextValue | null>(null)

export function MascotProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [config, setConfig] = useState<MascotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/mascot', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) {
        setConfig(null)
        return
      }
      const data = await res.json()
      setConfig(data)
    } catch {
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const screen = pathnameToScreenContext(pathname)
  const signals = useMemo(() => deriveAppSignals(dashboardData), [dashboardData])

  const resolved = useMemo(() => {
    if (!config) return null
    return resolveMascot(config, screen, signals)
  }, [config, screen, signals])

  const value = useMemo(
    () => ({
      config,
      resolved,
      loading,
      refresh: fetchConfig,
      setDashboardData,
    }),
    [config, resolved, loading, fetchConfig]
  )

  return <MascotCtx.Provider value={value}>{children}</MascotCtx.Provider>
}

const FALLBACK: MascotContextValue = {
  config: null,
  resolved: null,
  loading: true,
  refresh: async () => {},
  setDashboardData: () => {},
}

export function useMascot() {
  return useContext(MascotCtx) ?? FALLBACK
}
