import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilidades de tiempo/hora
export function getTurno(hora: number): 'mañana' | 'tarde' | 'noche' {
  if (hora < 12) return 'mañana'
  if (hora < 19) return 'tarde'
  return 'noche'
}

export function formatearHora(hora: string): string {
  return hora.substring(0, 5) // "08:00:00" → "08:00"
}

export function formatearFechaDia(fecha: Date): string {
  return fecha.toISOString().split('T')[0]
}
