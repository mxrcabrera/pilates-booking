import { Calendar, Clock, User, CheckCircle } from 'lucide-react'

interface ClasePreview {
  dia: string
  fecha: string
  hora: string
  alumno: string
  estado: 'pendiente' | 'asistida'
}

const clasesPreview: ClasePreview[] = [
  { dia: 'Hoy', fecha: '15 Ene', hora: '09:00', alumno: 'María García', estado: 'asistida' },
  { dia: 'Hoy', fecha: '15 Ene', hora: '10:00', alumno: 'Carlos López', estado: 'pendiente' },
  { dia: 'Mañana', fecha: '16 Ene', hora: '09:00', alumno: 'Ana Martínez', estado: 'pendiente' },
  { dia: 'Pasado mañana', fecha: '17 Ene', hora: '14:00', alumno: 'Pedro Sánchez', estado: 'pendiente' },
  { dia: 'Pasado mañana', fecha: '17 Ene', hora: '15:00', alumno: 'Laura Rodríguez', estado: 'pendiente' },
]

export function LandingCalendarPreview() {
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
          <Calendar size={20} style={{ color: 'rgb(110 125 245)' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: 'white' }}>
            Calendario
          </h3>
        </div>
        <div style={{
          padding: '0.25rem 0.75rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '1rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: 'rgb(34 197 94)'
        }}>
          5 clases
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {clasesPreview.map((clase, index) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                minWidth: '3rem',
                padding: '0.5rem',
                background: 'rgba(110, 125, 245, 0.1)',
                border: '1px solid rgba(110, 125, 245, 0.2)',
                borderRadius: '0.375rem'
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'rgb(110 125 245)' }}>
                  {clase.dia}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {clase.fecha}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Clock size={12} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>
                    {clase.hora}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={12} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {clase.alumno}
                  </span>
                </div>
              </div>
            </div>
            {clase.estado === 'asistida' && (
              <CheckCircle size={16} style={{ color: 'rgb(34 197 94)' }} />
            )}
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
        Vista semanal. Marcar asistencia con un clic.
      </p>
    </div>
  )
}
