import {
  createPagoSchema,
  marcarPagadoSchema,
  marcarPendienteSchema,
  deletePagoSchema,
  pagoActionSchema
} from '@/lib/schemas/pago.schema'

describe('pago.schema', () => {
  describe('createPagoSchema', () => {
    const validData = {
      action: 'create' as const,
      alumnoId: '123e4567-e89b-12d3-a456-426614174000',
      monto: '25000',
      fechaVencimiento: '2025-12-31',
      mesCorrespondiente: '2025-12'
    }

    it('should validate correct data', () => {
      const result = createPagoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require valid alumnoId UUID', () => {
      const result = createPagoSchema.safeParse({ ...validData, alumnoId: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should transform monto from string to number', () => {
      const result = createPagoSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.monto).toBe(25000)
      }
    })

    it('should accept monto as number', () => {
      const result = createPagoSchema.safeParse({ ...validData, monto: 25000 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.monto).toBe(25000)
      }
    })

    it('should reject monto <= 0', () => {
      // Transform throws, so we use try/catch pattern
      expect(() => createPagoSchema.parse({ ...validData, monto: 0 })).toThrow()
      expect(() => createPagoSchema.parse({ ...validData, monto: -100 })).toThrow()
    })

    it('should reject NaN monto', () => {
      expect(() => createPagoSchema.parse({ ...validData, monto: 'abc' })).toThrow()
    })

    it('should require fechaVencimiento', () => {
      const result = createPagoSchema.safeParse({ ...validData, fechaVencimiento: '' })
      expect(result.success).toBe(false)
    })

    it('should require mesCorrespondiente', () => {
      const result = createPagoSchema.safeParse({ ...validData, mesCorrespondiente: '' })
      expect(result.success).toBe(false)
    })

    it('should accept optional profesorId', () => {
      const result = createPagoSchema.safeParse({
        ...validData,
        profesorId: '123e4567-e89b-12d3-a456-426614174001'
      })
      expect(result.success).toBe(true)
    })

    it('should validate profesorId as UUID if provided', () => {
      const result = createPagoSchema.safeParse({
        ...validData,
        profesorId: 'invalid'
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional tipoPago enum', () => {
      const mensualResult = createPagoSchema.safeParse({ ...validData, tipoPago: 'mensual' })
      expect(mensualResult.success).toBe(true)

      const claseResult = createPagoSchema.safeParse({ ...validData, tipoPago: 'clase' })
      expect(claseResult.success).toBe(true)
    })

    it('should reject invalid tipoPago', () => {
      const result = createPagoSchema.safeParse({ ...validData, tipoPago: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should transform clasesEsperadas from string', () => {
      const result = createPagoSchema.safeParse({ ...validData, clasesEsperadas: '8' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clasesEsperadas).toBe(8)
      }
    })

    it('should accept null clasesEsperadas', () => {
      const result = createPagoSchema.safeParse({ ...validData, clasesEsperadas: null })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clasesEsperadas).toBeNull()
      }
    })
  })

  describe('marcarPagadoSchema', () => {
    it('should validate correct marcarPagado action', () => {
      const result = marcarPagadoSchema.safeParse({
        action: 'marcarPagado',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const result = marcarPagadoSchema.safeParse({
        action: 'marcarPagado',
        id: 'invalid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('marcarPendienteSchema', () => {
    it('should validate correct marcarPendiente action', () => {
      const result = marcarPendienteSchema.safeParse({
        action: 'marcarPendiente',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const result = marcarPendienteSchema.safeParse({
        action: 'marcarPendiente',
        id: 'invalid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('deletePagoSchema', () => {
    it('should validate correct delete action', () => {
      const result = deletePagoSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const result = deletePagoSchema.safeParse({
        action: 'delete',
        id: 'invalid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('pagoActionSchema (discriminated union)', () => {
    it('should route to correct schema based on action', () => {
      const createResult = pagoActionSchema.safeParse({
        action: 'create',
        alumnoId: '123e4567-e89b-12d3-a456-426614174000',
        monto: 25000,
        fechaVencimiento: '2025-12-31',
        mesCorrespondiente: '2025-12'
      })
      expect(createResult.success).toBe(true)

      const pagadoResult = pagoActionSchema.safeParse({
        action: 'marcarPagado',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(pagadoResult.success).toBe(true)

      const pendienteResult = pagoActionSchema.safeParse({
        action: 'marcarPendiente',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(pendienteResult.success).toBe(true)

      const deleteResult = pagoActionSchema.safeParse({
        action: 'delete',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(deleteResult.success).toBe(true)
    })

    it('should reject invalid action', () => {
      const result = pagoActionSchema.safeParse({
        action: 'invalid',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(false)
    })
  })
})
