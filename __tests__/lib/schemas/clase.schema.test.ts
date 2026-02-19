import {
  createClaseSchema,
  updateClaseSchema,
  deleteClaseSchema,
  changeStatusSchema,
  changeAsistenciaSchema,
  claseActionSchema
} from '@/lib/schemas/clase.schema'

describe('clase.schema', () => {
  describe('createClaseSchema', () => {
    const validData = {
      action: 'create' as const,
      horaInicio: '10:00',
      fecha: '2025-12-19'
    }

    it('should validate correct data', () => {
      const result = createClaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate hora format HH:MM', () => {
      const validHours = ['00:00', '09:30', '12:00', '17:45', '23:59']
      validHours.forEach(hora => {
        const result = createClaseSchema.safeParse({ ...validData, horaInicio: hora })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid hora format', () => {
      const invalidHours = ['8:00', '9:5', '24:00', '12:60', 'abc', '']
      invalidHours.forEach(hora => {
        const result = createClaseSchema.safeParse({ ...validData, horaInicio: hora })
        expect(result.success).toBe(false)
      })
    })

    it('should validate fecha format YYYY-MM-DD', () => {
      const validDates = ['2025-01-01', '2025-12-31', '2024-06-15']
      validDates.forEach(fecha => {
        const result = createClaseSchema.safeParse({ ...validData, fecha })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid fecha format', () => {
      const invalidDates = ['19-12-2025', '2025/12/19', '2025-1-1', 'invalid']
      invalidDates.forEach(fecha => {
        const result = createClaseSchema.safeParse({ ...validData, fecha })
        expect(result.success).toBe(false)
      })
    })

    it('should default alumnoIds to empty array', () => {
      const result = createClaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.alumnoIds).toEqual([])
      }
    })

    it('should accept valid alumnoIds', () => {
      const result = createClaseSchema.safeParse({
        ...validData,
        alumnoIds: ['123e4567-e89b-12d3-a456-426614174000']
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid alumnoIds', () => {
      const result = createClaseSchema.safeParse({
        ...validData,
        alumnoIds: ['not-a-uuid']
      })
      expect(result.success).toBe(false)
    })

    it('should default esClasePrueba to false', () => {
      const result = createClaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.esClasePrueba).toBe(false)
      }
    })

    it('should default esRecurrente to false', () => {
      const result = createClaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.esRecurrente).toBe(false)
      }
    })

    it('should not include frecuenciaSemanal (resolved from pack on backend)', () => {
      const result = createClaseSchema.safeParse({
        ...validData,
        frecuenciaSemanal: '2'
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect('frecuenciaSemanal' in result.data).toBe(false)
      }
    })

    it('should accept diasSemana as array', () => {
      const result = createClaseSchema.safeParse({
        ...validData,
        diasSemana: [1, 3, 5] // Mon, Wed, Fri
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.diasSemana).toEqual([1, 3, 5])
      }
    })

    it('should transform diasSemana from JSON string', () => {
      const result = createClaseSchema.safeParse({
        ...validData,
        diasSemana: '[1, 3, 5]'
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.diasSemana).toEqual([1, 3, 5])
      }
    })

    it('should validate diasSemana values (0-6)', () => {
      const invalid = createClaseSchema.safeParse({
        ...validData,
        diasSemana: [7]
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('updateClaseSchema', () => {
    const validData = {
      action: 'update' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      horaInicio: '10:00',
      estado: 'reservada' as const,
      fecha: '2025-12-19'
    }

    it('should validate correct data', () => {
      const result = updateClaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require valid UUID for id', () => {
      const result = updateClaseSchema.safeParse({ ...validData, id: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should validate estado enum', () => {
      const validEstados = ['reservada', 'completada', 'cancelada']
      validEstados.forEach(estado => {
        const result = updateClaseSchema.safeParse({ ...validData, estado })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid estado', () => {
      const result = updateClaseSchema.safeParse({ ...validData, estado: 'pendiente' })
      expect(result.success).toBe(false)
    })

    it('should accept null alumnoId', () => {
      const result = updateClaseSchema.safeParse({ ...validData, alumnoId: null })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteClaseSchema', () => {
    it('should validate correct delete action', () => {
      const result = deleteClaseSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const result = deleteClaseSchema.safeParse({
        action: 'delete',
        id: 'not-valid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('changeStatusSchema', () => {
    it('should validate correct changeStatus action', () => {
      const result = changeStatusSchema.safeParse({
        action: 'changeStatus',
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'completada'
      })
      expect(result.success).toBe(true)
    })

    it('should validate estado enum', () => {
      const validEstados = ['reservada', 'completada', 'cancelada']
      validEstados.forEach(estado => {
        const result = changeStatusSchema.safeParse({
          action: 'changeStatus',
          id: '123e4567-e89b-12d3-a456-426614174000',
          estado
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid estado', () => {
      const result = changeStatusSchema.safeParse({
        action: 'changeStatus',
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'invalido'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('changeAsistenciaSchema', () => {
    it('should validate correct changeAsistencia action', () => {
      const result = changeAsistenciaSchema.safeParse({
        action: 'changeAsistencia',
        id: '123e4567-e89b-12d3-a456-426614174000',
        asistencia: 'presente'
      })
      expect(result.success).toBe(true)
    })

    it('should validate asistencia enum', () => {
      const validAsistencias = ['pendiente', 'presente', 'ausente']
      validAsistencias.forEach(asistencia => {
        const result = changeAsistenciaSchema.safeParse({
          action: 'changeAsistencia',
          id: '123e4567-e89b-12d3-a456-426614174000',
          asistencia
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid asistencia', () => {
      const result = changeAsistenciaSchema.safeParse({
        action: 'changeAsistencia',
        id: '123e4567-e89b-12d3-a456-426614174000',
        asistencia: 'invalido'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('claseActionSchema (discriminated union)', () => {
    it('should route to correct schema based on action', () => {
      const createResult = claseActionSchema.safeParse({
        action: 'create',
        horaInicio: '10:00',
        fecha: '2025-12-19'
      })
      expect(createResult.success).toBe(true)

      const deleteResult = claseActionSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(deleteResult.success).toBe(true)

      const statusResult = claseActionSchema.safeParse({
        action: 'changeStatus',
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'completada'
      })
      expect(statusResult.success).toBe(true)
    })

    it('should reject invalid action', () => {
      const result = claseActionSchema.safeParse({
        action: 'invalid'
      })
      expect(result.success).toBe(false)
    })
  })
})
