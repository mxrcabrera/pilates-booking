import { CreditCard, Clock } from 'lucide-react'

interface PagoPreview {
  alumno: string
  monto: string
  fecha: string
  estado: 'pagado' | 'pendiente'
}

const pagosPreview: PagoPreview[] = [
  { alumno: 'María García', monto: '$20.000', fecha: '15 Ene', estado: 'pagado' },
  { alumno: 'Carlos López', monto: '$36.000', fecha: '10 Ene', estado: 'pendiente' },
  { alumno: 'Ana Martínez', monto: '$20.000', fecha: '12 Ene', estado: 'pagado' },
]

export function LandingPaymentsPreview() {
  return (
    <div style={{
      background: 'rgba(25, 30, 50, 0.55)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(120, 140, 220, 0.18)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-3xl)',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CreditCard size={20} style={{ color: 'rgb(110 125 245)' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: 'white' }}>
            Pagos
          </h3>
        </div>
        <div style={{
          padding: '0.25rem 0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '1rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: 'rgb(239 68 68)'
        }}>
          1 pendiente
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {pagosPreview.map((pago, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(120, 140, 220, 0.1)',
            borderRadius: '0.5rem',
            transition: 'background 0.2s'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.25rem' }}>
                {pago.alumno}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={12} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {pago.fecha}
                </span>
              </div>
            </div>
            <div style={{
              padding: '0.25rem 0.75rem',
              background: pago.estado === 'pagado' ? 'rgba(34, 197 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: pago.estado === 'pagado' ? '1px solid rgba(34, 197 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: pago.estado === 'pagado' ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
              minWidth: '4rem',
              textAlign: 'center'
            }}>
              {pago.monto}
            </div>
          </div>
        ))}
      </div>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 1.5
      }}>
        Seguimiento de pagos y deudas.
      </p>
    </div>
  )
}
