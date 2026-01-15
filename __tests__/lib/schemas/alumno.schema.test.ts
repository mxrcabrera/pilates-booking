import {
  createAlumnoSchema,
  updateAlumnoSchema,
  deleteAlumnoSchema,
  toggleStatusSchema,
  alumnoActionSchema
} from '@/lib/schemas/alumno.schema'

describe('alumno.schema', () => {
  describe('createAlumnoSchema', () => {
    const validData = {
      action: 'create' as const,
      nombre: 'María García',
      email: 'maria@example.com',
      telefono: '1155667788',
      packType: '2x-semana',
      precio: '25000'
    }

    it('should validate correct data', () => {
      const result = createAlumnoSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nombre).toBe('María García')
        expect(result.data.precio).toBe(25000) // Transformed to number
      }
    })

    it('should require nombre', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, nombre: '' })
      expect(result.success).toBe(false)
    })

    it('should validate email format', () => {
      const invalidEmails = ['invalid', 'test@', '@test.com', 'test@.com']
      invalidEmails.forEach(email => {
        const result = createAlumnoSchema.safeParse({ ...validData, email })
        expect(result.success).toBe(false)
      })
    })

    it('should accept valid email formats', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co', 'user+tag@example.org']
      validEmails.forEach(email => {
        const result = createAlumnoSchema.safeParse({ ...validData, email })
        expect(result.success).toBe(true)
      })
    })

    it('should require telefono', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, telefono: '' })
      expect(result.success).toBe(false)
    })

    it('should require packType', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, packType: '' })
      expect(result.success).toBe(false)
    })

    it('should transform precio from string to number', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, precio: '35000.50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.precio).toBe(35000.5)
      }
    })

    it('should accept precio as number', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, precio: 25000 })
      expect(result.success).toBe(true)
    })

    it('should default genero to F', () => {
      const result = createAlumnoSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.genero).toBe('F')
      }
    })

    it('should accept valid genero values', () => {
      ['F', 'M', 'O'].forEach(genero => {
        const result = createAlumnoSchema.safeParse({ ...validData, genero })
        expect(result.success).toBe(true)
      })
    })

    it('should clamp diaInicioCiclo between 1 and 28', () => {
      const tooLow = createAlumnoSchema.safeParse({ ...validData, diaInicioCiclo: 0 })
      expect(tooLow.success).toBe(true)
      if (tooLow.success) expect(tooLow.data.diaInicioCiclo).toBe(1)

      const tooHigh = createAlumnoSchema.safeParse({ ...validData, diaInicioCiclo: 31 })
      expect(tooHigh.success).toBe(true)
      if (tooHigh.success) expect(tooHigh.data.diaInicioCiclo).toBe(28)

      const valid = createAlumnoSchema.safeParse({ ...validData, diaInicioCiclo: 15 })
      expect(valid.success).toBe(true)
      if (valid.success) expect(valid.data.diaInicioCiclo).toBe(15)
    })

    it('should accept optional patologias', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, patologias: 'Escoliosis leve' })
      expect(result.success).toBe(true)
    })

    it('should limit patologias to 500 chars', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, patologias: 'a'.repeat(501) })
      expect(result.success).toBe(false)
    })

    it('should limit nombre to 100 chars', () => {
      const result = createAlumnoSchema.safeParse({ ...validData, nombre: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })
  })

  describe('updateAlumnoSchema', () => {
    const validData = {
      action: 'update' as const,
      id: '123e4567-e89b-12d3-a456-426614174000'
    }

    it('should validate with only id', () => {
      const result = updateAlumnoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require valid UUID for id', () => {
      const result = updateAlumnoSchema.safeParse({ ...validData, id: 'invalid-id' })
      expect(result.success).toBe(false)
    })

    it('should accept partial updates', () => {
      const result = updateAlumnoSchema.safeParse({ ...validData, nombre: 'Nuevo Nombre' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nombre).toBe('Nuevo Nombre')
        expect(result.data.email).toBeUndefined()
      }
    })

    it('should validate email if provided', () => {
      const invalid = updateAlumnoSchema.safeParse({ ...validData, email: 'invalid' })
      expect(invalid.success).toBe(false)

      const valid = updateAlumnoSchema.safeParse({ ...validData, email: 'valid@email.com' })
      expect(valid.success).toBe(true)
    })
  })

  describe('deleteAlumnoSchema', () => {
    it('should validate correct delete action', () => {
      const result = deleteAlumnoSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const result = deleteAlumnoSchema.safeParse({
        action: 'delete',
        id: 'not-a-uuid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('toggleStatusSchema', () => {
    it('should validate correct toggleStatus action', () => {
      const result = toggleStatusSchema.safeParse({
        action: 'toggleStatus',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('alumnoActionSchema (discriminated union)', () => {
    it('should route to correct schema based on action', () => {
      const createResult = alumnoActionSchema.safeParse({
        action: 'create',
        nombre: 'Test',
        email: 'test@test.com',
        telefono: '123',
        packType: 'pack1',
        precio: 100
      })
      expect(createResult.success).toBe(true)

      const deleteResult = alumnoActionSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(deleteResult.success).toBe(true)
    })

    it('should reject invalid action', () => {
      const result = alumnoActionSchema.safeParse({
        action: 'invalid',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(false)
    })
  })
})
