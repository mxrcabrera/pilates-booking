import { Users, Package } from 'lucide-react'

interface AlumnoPreview {
  nombre: string
  pack: string
  clasesRestantes: number
  estado: 'activo' | 'inactivo'
}

const alumnosPreview: AlumnoPreview[] = [
  { nombre: 'María García', pack: 'Pack 4 clases', clasesRestantes: 2, estado: 'activo' },
  { nombre: 'Carlos López', pack: 'Pack 8 clases', clasesRestantes: 5, estado: 'activo' },
  { nombre: 'Ana Martínez', pack: 'Pack 4 clases', clasesRestantes: 4, estado: 'activo' },
  { nombre: 'Pedro Sánchez', pack: 'Pack 12 clases', clasesRestantes: 0, estado: 'inactivo' },
]

export function LandingStudentsPreview() {
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
          <Users size={20} style={{ color: 'rgb(110 125 245)' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: 'white' }}>
            Alumnos
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
          4 alumnos
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {alumnosPreview.map((alumno, index) => (
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
                {alumno.nombre}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={12} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {alumno.pack}
                </span>
              </div>
            </div>
            <div style={{
              padding: '0.25rem 0.75rem',
              background: alumno.clasesRestantes > 0 ? 'rgba(34, 197 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: alumno.clasesRestantes > 0 ? '1px solid rgba(34, 197 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: alumno.clasesRestantes > 0 ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
              minWidth: '3rem',
              textAlign: 'center'
            }}>
              {alumno.clasesRestantes}
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
        Control de packs y clases restantes.
      </p>
    </div>
  )
}
