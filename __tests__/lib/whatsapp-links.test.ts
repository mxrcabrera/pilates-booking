import {
  getWhatsAppLink,
  getClaseNuevaMessage,
  getClaseModificadaMessage,
  getClaseCanceladaMessage,
  getRecordatorioClaseMessage,
  getLugarDisponibleMessage,
  getRecordatorioPagoMessage,
  getBienvenidaMessage,
  getMensajeGenericoMessage
} from '@/lib/whatsapp-links'

describe('whatsapp-links', () => {
  describe('getWhatsAppLink', () => {
    it('should generate correct wa.me link', () => {
      const link = getWhatsAppLink('1155667788', 'Hola!')
      expect(link).toContain('https://wa.me/')
      expect(link).toContain('?text=')
      expect(link).toContain('Hola')
    })

    it('should format phone removing spaces and dashes', () => {
      const link = getWhatsAppLink('11 5566-7788', 'Test')
      expect(link).toContain('5411556')
    })

    it('should remove leading 0 from phone', () => {
      const link = getWhatsAppLink('01155667788', 'Test')
      expect(link).not.toContain('/0')
    })

    it('should add 54 prefix for Argentina numbers', () => {
      const link = getWhatsAppLink('1155667788', 'Test')
      expect(link).toContain('/541155667788')
    })

    it('should not double prefix if already has 54', () => {
      const link = getWhatsAppLink('541155667788', 'Test')
      expect(link).toContain('/541155667788')
      expect(link).not.toContain('5454')
    })

    it('should remove + from phone', () => {
      const link = getWhatsAppLink('+541155667788', 'Test')
      expect(link).toContain('/541155667788')
      expect(link).not.toContain('+')
    })

    it('should encode message', () => {
      const link = getWhatsAppLink('1155667788', 'Hola María!')
      expect(link).toContain('Hola%20Mar%C3%ADa!')
    })

    it('should encode newlines', () => {
      const link = getWhatsAppLink('1155667788', 'Hola\nMundo')
      expect(link).toContain('%0A')
    })
  })

  describe('message generators', () => {
    describe('getClaseNuevaMessage', () => {
      it('should include alumno name, date and time', () => {
        const msg = getClaseNuevaMessage('María', '19/12/2025', '10:00')
        expect(msg).toContain('María')
        expect(msg).toContain('19/12/2025')
        expect(msg).toContain('10:00')
      })
    })

    describe('getClaseModificadaMessage', () => {
      it('should include alumno name and new date/time', () => {
        const msg = getClaseModificadaMessage('Juan', '20/12/2025', '11:00')
        expect(msg).toContain('Juan')
        expect(msg).toContain('20/12/2025')
        expect(msg).toContain('11:00')
        expect(msg).toContain('reprogramada')
      })
    })

    describe('getClaseCanceladaMessage', () => {
      it('should include alumno name, date, time and apologetic tone', () => {
        const msg = getClaseCanceladaMessage('Ana', '19/12/2025', '10:00')
        expect(msg).toContain('Ana')
        expect(msg).toContain('19/12/2025')
        expect(msg).toContain('10:00')
        expect(msg).toContain('cancelar')
      })
    })

    describe('getRecordatorioClaseMessage', () => {
      it('should include alumno name and time', () => {
        const msg = getRecordatorioClaseMessage('Carlos', '15:00')
        expect(msg).toContain('Carlos')
        expect(msg).toContain('15:00')
        expect(msg).toContain('mañana')
      })
    })

    describe('getLugarDisponibleMessage', () => {
      it('should include alumno name, date and time', () => {
        const msg = getLugarDisponibleMessage('Laura', '21/12/2025', '09:00')
        expect(msg).toContain('Laura')
        expect(msg).toContain('21/12/2025')
        expect(msg).toContain('09:00')
        expect(msg).toContain('liberó')
      })
    })

    describe('getRecordatorioPagoMessage', () => {
      it('should include alumno name and amount', () => {
        const msg = getRecordatorioPagoMessage('Pedro', '25000')
        expect(msg).toContain('Pedro')
        expect(msg).toContain('$25000')
        expect(msg).toContain('pago pendiente')
      })
    })

    describe('getBienvenidaMessage', () => {
      it('should include both alumno and profesor names', () => {
        const msg = getBienvenidaMessage('Sofía', 'Profesora María')
        expect(msg).toContain('Sofía')
        expect(msg).toContain('Profesora María')
        expect(msg).toContain('Bienvenido')
      })
    })

    describe('getMensajeGenericoMessage', () => {
      it('should include alumno name with greeting', () => {
        const msg = getMensajeGenericoMessage('Test User')
        expect(msg).toContain('Test User')
        expect(msg).toContain('Hola')
      })
    })
  })
})
