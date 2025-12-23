import { PlanType } from '@prisma/client'

export interface PlanFeatures {
  maxAlumnos: number
  clasesRecurrentes: boolean
  prorrateoAutomatico: boolean
  portalAlumnos: boolean
  configuracionHorarios: boolean
  googleCalendarSync: boolean
  notificacionesEmail: boolean
  exportarExcel: boolean
  reportesBasicos: boolean
  listaEspera: boolean
  notificacionesWhatsApp: boolean
  multiplesUsuarios: boolean
  rolesPermisos: boolean
  reportesAvanzados: boolean
  soportePrioritario: boolean
  onboardingAsistido: boolean
}

export interface PlanConfig {
  name: string
  price: number // en ARS, 0 = gratis, -1 = contactar
  features: PlanFeatures
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: 'Free',
    price: 0,
    features: {
      maxAlumnos: 5,
      clasesRecurrentes: false,
      prorrateoAutomatico: false,
      portalAlumnos: false,
      configuracionHorarios: false,
      googleCalendarSync: false,
      notificacionesEmail: false,
      exportarExcel: false,
      reportesBasicos: false,
      listaEspera: false,
      notificacionesWhatsApp: false,
      multiplesUsuarios: false,
      rolesPermisos: false,
      reportesAvanzados: false,
      soportePrioritario: false,
      onboardingAsistido: false,
    },
  },
  STARTER: {
    name: 'Starter',
    price: 28000,
    features: {
      maxAlumnos: 20,
      clasesRecurrentes: true,
      prorrateoAutomatico: true,
      portalAlumnos: true,
      configuracionHorarios: true,
      googleCalendarSync: false,
      notificacionesEmail: false,
      exportarExcel: false,
      reportesBasicos: false,
      listaEspera: false,
      notificacionesWhatsApp: false,
      multiplesUsuarios: false,
      rolesPermisos: false,
      reportesAvanzados: false,
      soportePrioritario: false,
      onboardingAsistido: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 48000,
    features: {
      maxAlumnos: 50,
      clasesRecurrentes: true,
      prorrateoAutomatico: true,
      portalAlumnos: true,
      configuracionHorarios: true,
      googleCalendarSync: true,
      notificacionesEmail: true,
      exportarExcel: true,
      reportesBasicos: true,
      listaEspera: true,
      notificacionesWhatsApp: false,
      multiplesUsuarios: false,
      rolesPermisos: false,
      reportesAvanzados: false,
      soportePrioritario: false,
      onboardingAsistido: false,
    },
  },
  ESTUDIO: {
    name: 'Max',
    price: -1, // Contactar
    features: {
      maxAlumnos: 150,
      clasesRecurrentes: true,
      prorrateoAutomatico: true,
      portalAlumnos: true,
      configuracionHorarios: true,
      googleCalendarSync: true,
      notificacionesEmail: true,
      exportarExcel: true,
      reportesBasicos: true,
      listaEspera: true,
      notificacionesWhatsApp: true,
      multiplesUsuarios: true,
      rolesPermisos: true,
      reportesAvanzados: true,
      soportePrioritario: true,
      onboardingAsistido: true,
    },
  },
}

// Trial config
export const TRIAL_DAYS = 14
export const TRIAL_MAX_ALUMNOS = 10
export const TRIAL_PLAN_FEATURES = PLAN_CONFIGS.PRO.features // Trial tiene features de Pro

// Helper functions
export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan]
}

export function getPlanFeatures(plan: PlanType): PlanFeatures {
  return PLAN_CONFIGS[plan].features
}

export function isTrialActive(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false
  return new Date() < new Date(trialEndsAt)
}

export function getEffectiveFeatures(
  plan: PlanType,
  trialEndsAt: Date | null
): PlanFeatures {
  // Durante el trial, tiene features de Pro
  if (isTrialActive(trialEndsAt)) {
    return TRIAL_PLAN_FEATURES
  }
  return getPlanFeatures(plan)
}

export function getEffectiveMaxAlumnos(
  plan: PlanType,
  trialEndsAt: Date | null
): number {
  // Durante el trial, máximo 10 alumnos
  if (isTrialActive(trialEndsAt)) {
    return TRIAL_MAX_ALUMNOS
  }
  return PLAN_CONFIGS[plan].features.maxAlumnos
}

export function canUseFeature(
  feature: keyof PlanFeatures,
  plan: PlanType,
  trialEndsAt: Date | null
): boolean {
  const features = getEffectiveFeatures(plan, trialEndsAt)
  return features[feature] === true
}

export function getDaysLeftInTrial(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0
  const now = new Date()
  const end = new Date(trialEndsAt)
  if (now >= end) return 0
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getTrialEndDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + TRIAL_DAYS)
  return date
}

// Plan upgrade suggestions based on limits hit
export function getSuggestedUpgrade(
  currentPlan: PlanType,
  reason: 'alumnos' | 'feature'
): PlanType | null {
  const upgradeMap: Record<PlanType, PlanType | null> = {
    FREE: 'STARTER',
    STARTER: 'PRO',
    PRO: 'ESTUDIO',
    ESTUDIO: null,
  }
  return upgradeMap[currentPlan]
}
