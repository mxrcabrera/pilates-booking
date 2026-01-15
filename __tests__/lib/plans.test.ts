import {
  PLAN_CONFIGS,
  TRIAL_DAYS,
  TRIAL_MAX_ALUMNOS,
  getPlanFeatures,
  isTrialActive,
  getEffectiveFeatures,
  getEffectiveMaxAlumnos,
  canUseFeature,
  getDaysLeftInTrial,
  getTrialEndDate,
  getSuggestedUpgrade
} from '@/lib/plans'

describe('plans', () => {
  describe('PLAN_CONFIGS', () => {
    it('should have all plan types defined', () => {
      expect(PLAN_CONFIGS.FREE).toBeDefined()
      expect(PLAN_CONFIGS.STARTER).toBeDefined()
      expect(PLAN_CONFIGS.PRO).toBeDefined()
      expect(PLAN_CONFIGS.ESTUDIO).toBeDefined()
    })

    it('should have correct maxAlumnos limits', () => {
      expect(PLAN_CONFIGS.FREE.features.maxAlumnos).toBe(5)
      expect(PLAN_CONFIGS.STARTER.features.maxAlumnos).toBe(20)
      expect(PLAN_CONFIGS.PRO.features.maxAlumnos).toBe(50)
      expect(PLAN_CONFIGS.ESTUDIO.features.maxAlumnos).toBe(150)
    })

    it('should have correct prices', () => {
      expect(PLAN_CONFIGS.FREE.price).toBe(0)
      expect(PLAN_CONFIGS.STARTER.price).toBe(28000)
      expect(PLAN_CONFIGS.PRO.price).toBe(48000)
      expect(PLAN_CONFIGS.ESTUDIO.price).toBe(-1) // Contactar
    })

    it('FREE plan should have all features disabled except basics', () => {
      const { features } = PLAN_CONFIGS.FREE
      expect(features.clasesRecurrentes).toBe(false)
      expect(features.prorrateoAutomatico).toBe(false)
      expect(features.googleCalendarSync).toBe(false)
      expect(features.reportesBasicos).toBe(false)
    })

    it('ESTUDIO plan should have all features enabled', () => {
      const { features } = PLAN_CONFIGS.ESTUDIO
      expect(features.clasesRecurrentes).toBe(true)
      expect(features.googleCalendarSync).toBe(true)
      expect(features.reportesBasicos).toBe(true)
      expect(features.reportesAvanzados).toBe(true)
      expect(features.multiplesUsuarios).toBe(true)
    })
  })

  describe('getPlanFeatures', () => {
    it('should return features for given plan', () => {
      const freeFeatures = getPlanFeatures('FREE')
      expect(freeFeatures.maxAlumnos).toBe(5)

      const proFeatures = getPlanFeatures('PRO')
      expect(proFeatures.googleCalendarSync).toBe(true)
    })
  })

  describe('isTrialActive', () => {
    it('should return false for null', () => {
      expect(isTrialActive(null)).toBe(false)
    })

    it('should return true for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isTrialActive(futureDate)).toBe(true)
    })

    it('should return false for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isTrialActive(pastDate)).toBe(false)
    })

    it('should return false for current date', () => {
      const now = new Date()
      expect(isTrialActive(now)).toBe(false)
    })
  })

  describe('getEffectiveFeatures', () => {
    it('should return plan features when no trial', () => {
      const features = getEffectiveFeatures('FREE', null)
      expect(features.maxAlumnos).toBe(5)
      expect(features.clasesRecurrentes).toBe(false)
    })

    it('should return PRO features during trial', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const features = getEffectiveFeatures('FREE', futureDate)
      expect(features.clasesRecurrentes).toBe(true)
      expect(features.googleCalendarSync).toBe(true)
    })

    it('should return plan features after trial expires', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const features = getEffectiveFeatures('FREE', pastDate)
      expect(features.clasesRecurrentes).toBe(false)
    })
  })

  describe('getEffectiveMaxAlumnos', () => {
    it('should return plan limit when no trial', () => {
      expect(getEffectiveMaxAlumnos('FREE', null)).toBe(5)
      expect(getEffectiveMaxAlumnos('PRO', null)).toBe(50)
    })

    it('should return trial limit during trial', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      expect(getEffectiveMaxAlumnos('FREE', futureDate)).toBe(TRIAL_MAX_ALUMNOS)
    })

    it('should return plan limit after trial', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      expect(getEffectiveMaxAlumnos('FREE', pastDate)).toBe(5)
    })
  })

  describe('canUseFeature', () => {
    it('should return false for disabled features', () => {
      expect(canUseFeature('clasesRecurrentes', 'FREE', null)).toBe(false)
      expect(canUseFeature('reportesAvanzados', 'PRO', null)).toBe(false)
    })

    it('should return true for enabled features', () => {
      expect(canUseFeature('clasesRecurrentes', 'STARTER', null)).toBe(true)
      expect(canUseFeature('reportesAvanzados', 'ESTUDIO', null)).toBe(true)
    })

    it('should return true during trial for PRO features', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      expect(canUseFeature('googleCalendarSync', 'FREE', futureDate)).toBe(true)
    })
  })

  describe('getDaysLeftInTrial', () => {
    it('should return 0 for null', () => {
      expect(getDaysLeftInTrial(null)).toBe(0)
    })

    it('should return 0 for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(getDaysLeftInTrial(pastDate)).toBe(0)
    })

    it('should return correct days for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      // Due to time differences, it could be 5 or 6
      const days = getDaysLeftInTrial(futureDate)
      expect(days).toBeGreaterThanOrEqual(5)
      expect(days).toBeLessThanOrEqual(6)
    })
  })

  describe('getTrialEndDate', () => {
    it('should return date TRIAL_DAYS in the future', () => {
      const now = new Date()
      const trialEnd = getTrialEndDate()

      const diffTime = trialEnd.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(TRIAL_DAYS)
    })
  })

  describe('getSuggestedUpgrade', () => {
    it('should suggest next plan in hierarchy', () => {
      expect(getSuggestedUpgrade('FREE', 'alumnos')).toBe('STARTER')
      expect(getSuggestedUpgrade('STARTER', 'feature')).toBe('PRO')
      expect(getSuggestedUpgrade('PRO', 'alumnos')).toBe('ESTUDIO')
    })

    it('should return null for ESTUDIO', () => {
      expect(getSuggestedUpgrade('ESTUDIO', 'alumnos')).toBeNull()
    })
  })
})
