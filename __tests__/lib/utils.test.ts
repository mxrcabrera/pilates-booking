import { getErrorMessage, getTurno, formatearHora, formatearFechaDia, cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (classnames)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error')
      expect(getErrorMessage(error)).toBe('Test error')
    })

    it('should return string as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error')
    })

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('Error desconocido')
      expect(getErrorMessage(undefined)).toBe('Error desconocido')
      expect(getErrorMessage(123)).toBe('Error desconocido')
      expect(getErrorMessage({})).toBe('Error desconocido')
    })
  })

  describe('getTurno', () => {
    it('should return mañana for morning hours', () => {
      expect(getTurno(8)).toBe('mañana')
      expect(getTurno(10)).toBe('mañana')
      expect(getTurno(12)).toBe('mañana')
    })

    it('should return tarde for afternoon hours', () => {
      expect(getTurno(17)).toBe('tarde')
      expect(getTurno(19)).toBe('tarde')
      expect(getTurno(21)).toBe('tarde')
    })

    it('should return noche for night hours', () => {
      expect(getTurno(22)).toBe('noche')
      expect(getTurno(23)).toBe('noche')
    })

    it('should respect custom horarioTardeInicio', () => {
      expect(getTurno(15, '14:00')).toBe('tarde')
      expect(getTurno(13, '14:00')).toBe('mañana')
      expect(getTurno(18, '18:00')).toBe('tarde')
    })
  })

  describe('formatearHora', () => {
    it('should extract HH:MM from full time string', () => {
      expect(formatearHora('08:00:00')).toBe('08:00')
      expect(formatearHora('17:30:00')).toBe('17:30')
      expect(formatearHora('23:59:59')).toBe('23:59')
    })

    it('should handle already short format', () => {
      expect(formatearHora('08:00')).toBe('08:00')
    })
  })

  describe('formatearFechaDia', () => {
    it('should extract date from ISO string', () => {
      expect(formatearFechaDia('2025-12-19T00:00:00.000Z')).toBe('2025-12-19')
      expect(formatearFechaDia('2025-01-01T15:30:00.000Z')).toBe('2025-01-01')
    })

    it('should format DB dates (midnight UTC) using UTC', () => {
      const dbDate = new Date('2025-12-19T00:00:00.000Z')
      expect(formatearFechaDia(dbDate)).toBe('2025-12-19')
    })

    it('should format local dates using local timezone', () => {
      // Create a date that's clearly not midnight UTC
      const localDate = new Date(2025, 11, 19, 15, 30, 0) // Dec 19, 2025 3:30 PM local
      const result = formatearFechaDia(localDate)
      expect(result).toBe('2025-12-19')
    })

    it('should pad single digit months and days', () => {
      expect(formatearFechaDia('2025-01-05T00:00:00.000Z')).toBe('2025-01-05')
    })
  })
})
