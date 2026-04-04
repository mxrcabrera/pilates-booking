import { useMemo } from 'react'
import type { DashboardData } from './types'

export type BuddyStatus = 'zen' | 'peace' | 'celebrate'

export function useBuddyState(data: DashboardData | null | undefined): BuddyStatus {
  return useMemo(() => {
    if (!data) return 'peace' // Default while loading

    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6
    const clasesHoy = data.clasesHoy || []

    // No hay clases hoy o es finde -> zen
    if (clasesHoy.length === 0 || isWeekend) {
      return 'zen'
    }

    // Hay clases, revisemos el estado.
    // Si la lista de clases no está vacía y TODAS ya pasaron o están completadas/canceladas
    // Asumimos que si no hay 'reservada' o pendiente, todo el trabajo del día terminó.
    const allDone = clasesHoy.every(
      (c) => c.estado === 'completada' || c.estado === 'cancelada'
    )

    if (allDone) {
      return 'celebrate'
    }

    // Default: saludando al entrar (hay trabajo por hacer)
    return 'peace'
  }, [data])
}
