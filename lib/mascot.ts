import type { DashboardData } from './types'

export const MASCOT_APP_CONTEXTS = [
  { id: 'weekend', label: 'Fin de semana' },
  { id: 'no_classes', label: 'Sin clases hoy' },
  { id: 'free_spots', label: 'Hay lugares libres' },
  { id: 'day_done', label: 'Día terminado' },
  { id: 'default', label: 'Por defecto (cualquier otro momento)' },
] as const

export const MASCOT_SCREEN_CONTEXTS = [
  { id: 'screen_dashboard', label: 'Dashboard (Hoy)', path: '/dashboard' },
  { id: 'screen_calendario', label: 'Calendario', path: '/calendario' },
  { id: 'screen_alumnos', label: 'Alumnos', path: '/alumnos' },
  { id: 'screen_pagos', label: 'Pagos', path: '/pagos' },
  { id: 'screen_reportes', label: 'Reportes', path: '/reportes' },
  { id: 'screen_configuracion', label: 'Configuración', path: '/configuracion' },
  { id: 'screen_perfil', label: 'Perfil', path: '/perfil' },
  { id: 'screen_equipo', label: 'Equipo', path: '/equipo' },
  { id: 'screen_planes', label: 'Planes', path: '/planes' },
] as const

export type MascotAppContextId = (typeof MASCOT_APP_CONTEXTS)[number]['id']
export type MascotScreenContextId = (typeof MASCOT_SCREEN_CONTEXTS)[number]['id']
export type MascotContextId = MascotAppContextId | MascotScreenContextId

export type MascotImage = {
  id: string
  url: string
  label: string
  isDefault: boolean
  sortOrder: number
}

export type MascotRule = {
  id: string
  context: string
  tag: string
  priority: number
}

export type MascotAppSignals = {
  isWeekend: boolean
  noClasses: boolean
  freeSpots: boolean
  dayDone: boolean
}

export type MascotConfig = {
  buddyName: string
  images: MascotImage[]
  rules: MascotRule[]
}

export type ResolvedMascot = {
  tag: string
  context: MascotContextId
  images: MascotImage[]
  message: string
}

const MESSAGES: Record<string, string[]> = {
  weekend: ['¡Día libre, modo zen activado!', 'Namaste. Hoy descansamos', 'Sin clases hoy, a disfrutar'],
  no_classes: ['¡Día libre, modo zen activado!', 'Namaste. Hoy descansamos', 'Sin clases hoy, a disfrutar'],
  free_spots: ['¡Quedan lugares disponibles!', '¡Hay cupos libres hoy!', '¡Aprovechá los lugares!'],
  day_done: ['¡Genial! Ya terminamos por hoy', '¡Buen trabajo hoy!', '¡Día completado!'],
  default: ['¡Vamos con todo hoy!', '¡A dar lo mejor!', 'Hoy va a ser un gran día'],
  screen_dashboard: ['¡Vamos con todo hoy!', '¡A dar lo mejor!', 'Hoy va a ser un gran día'],
  screen_calendario: ['¡Organizá tu semana!', '¡Mirá tus horarios!', '¡Planificá tus clases!'],
  screen_alumnos: ['¡Tus alumnos te esperan!', '¡Gestioná tu equipo!', '¡Cuidá a tu comunidad!'],
  screen_pagos: ['¡Controlá tus ingresos!', '¡Todo al día con los pagos!', '¡Revisá los saldos!'],
  screen_reportes: ['¡Mirá cómo va el mes!', '¡Tus números en un vistazo!', '¡Analizá tu estudio!'],
  screen_configuracion: ['¡Ajustá tu estudio!', '¡Personalizá tu experiencia!', '¡Configurá todo a tu gusto!'],
  screen_perfil: ['¡Tu identidad de marca!', '¡Personalizá tu mascota!', '¡Hacé tuyo el sistema!'],
  screen_equipo: ['¡Tu equipo crece!', '¡Sumá colaboradores!', '¡Trabajen juntos!'],
  screen_planes: ['¡Elegí el plan ideal!', '¡Potenciá tu estudio!', '¡Más herramientas te esperan!'],
}

export function pathnameToScreenContext(pathname: string): MascotScreenContextId | null {
  const match = MASCOT_SCREEN_CONTEXTS.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`))
  return match?.id ?? null
}

export function deriveAppSignals(data: DashboardData | null | undefined): MascotAppSignals {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const clasesHoy = data?.clasesHoy ?? []

  if (!data || clasesHoy.length === 0) {
    return { isWeekend, noClasses: true, freeSpots: false, dayDone: false }
  }

  const clasesReservadas = clasesHoy.filter((c) => c.estado === 'reservada')
  const freeSpots = Boolean(
    data.maxAlumnosPorClase &&
      clasesReservadas.some((c) => !c.alumno)
  )

  const dayDone = clasesHoy.every(
    (c) => c.estado === 'completada' || c.estado === 'cancelada'
  )

  return { isWeekend, noClasses: false, freeSpots, dayDone }
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function imagesForTag(images: MascotImage[], tag: string): MascotImage[] {
  const normalized = normalizeTag(tag)
  return images
    .filter((img) => normalizeTag(img.label) === normalized)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function pickMessage(context: string): string {
  const pool = MESSAGES[context] ?? MESSAGES.default
  return pool[Math.floor(Math.random() * pool.length)]
}

function activeAppContexts(signals: MascotAppSignals): MascotAppContextId[] {
  const active: MascotAppContextId[] = []
  if (signals.isWeekend) active.push('weekend')
  if (signals.noClasses) active.push('no_classes')
  if (signals.freeSpots) active.push('free_spots')
  if (signals.dayDone) active.push('day_done')
  active.push('default')
  return active
}

export function resolveMascot(
  config: MascotConfig,
  screen: MascotScreenContextId | null,
  signals: MascotAppSignals
): ResolvedMascot | null {
  const { images, rules } = config
  if (images.length === 0) return null

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  if (screen) {
    const screenRule = sortedRules.find((r) => r.context === screen)
    if (screenRule) {
      const matched = imagesForTag(images, screenRule.tag)
      if (matched.length > 0) {
        return {
          tag: screenRule.tag,
          context: screen,
          images: matched,
          message: pickMessage(screen),
        }
      }
    }
  }

  const appContexts = activeAppContexts(signals)
  for (const ctx of appContexts) {
    const rule = sortedRules.find((r) => r.context === ctx)
    const tag = rule?.tag ?? (ctx === 'default' ? 'saludo' : null)
    if (!tag) continue

    const matched = imagesForTag(images, tag)
    if (matched.length > 0) {
      return {
        tag,
        context: ctx,
        images: matched,
        message: pickMessage(ctx),
      }
    }
  }

  const fallback = images.find((img) => img.isDefault) ?? images[0]
  return {
    tag: fallback.label,
    context: 'default',
    images: [fallback],
    message: pickMessage('default'),
  }
}

export const DEFAULT_MASCOT_RULES: Omit<MascotRule, 'id'>[] = [
  { context: 'screen_calendario', tag: 'estirando', priority: 100 },
  { context: 'screen_alumnos', tag: 'saludo', priority: 100 },
  { context: 'screen_pagos', tag: 'peace', priority: 100 },
  { context: 'weekend', tag: 'zen', priority: 90 },
  { context: 'no_classes', tag: 'zen', priority: 80 },
  { context: 'free_spots', tag: 'celebracion', priority: 70 },
  { context: 'day_done', tag: 'celebracion', priority: 60 },
  { context: 'default', tag: 'saludo', priority: 0 },
]

export function getAnimationClass(context: MascotContextId): string {
  if (context === 'weekend' || context === 'no_classes') return 'mascot-float-zen'
  if (context === 'free_spots' || context === 'day_done') return 'mascot-float-celebrate'
  return 'mascot-float-peace'
}
