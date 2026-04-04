import { useMemo } from 'react'
import type { DashboardData } from './types'

export type BuddyStatus = 'zen' | 'peace' | 'celebrate'

export function useBuddyState(data: DashboardData | null | undefined): BuddyStatus {
  return useMemo(() => {
    if (!data) return 'peace'

    const today = new Date()
    const dayOfWeek = today.getDay() // 0=dom, 1=lun, ... 6=sab
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const clasesHoy = data.clasesHoy || []

    // Sin clases hoy o fin de semana → zen (ommm)
    if (clasesHoy.length === 0 || isWeekend) {
      return 'zen'
    }

    // Se acerca el finde (jueves o viernes) → celebrate
    if (dayOfWeek === 4 || dayOfWeek === 5) {
      return 'celebrate'
    }

    // Hay lugares libres en alguna clase → celebrate
    if (data.maxAlumnosPorClase) {
      const clasesReservadas = clasesHoy.filter(c => c.estado === 'reservada')
      const tieneEspacioLibre = clasesReservadas.some(c => {
        // Si no tiene alumno asignado, hay lugar
        return !c.alumno
      })
      if (tieneEspacioLibre) {
        return 'celebrate'
      }
    }

    // Todas las clases terminaron → celebrate
    const allDone = clasesHoy.every(
      c => c.estado === 'completada' || c.estado === 'cancelada'
    )
    if (allDone) {
      return 'celebrate'
    }

    // Default: hay clases, a laburar → peace
    return 'peace'
  }, [data])
}