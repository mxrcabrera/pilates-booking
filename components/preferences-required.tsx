import Link from 'next/link'
import { Settings } from 'lucide-react'

interface PreferencesRequiredProps {
  missingFields: string[]
}

export function PreferencesRequired({ missingFields }: PreferencesRequiredProps) {
  return (
    <div className="page-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        textAlign: 'center',
        maxWidth: '400px',
        padding: '2rem'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(147, 155, 245, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '2px solid rgba(147, 155, 245, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Settings size={36} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />
        </div>

        <div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '0.75rem'
          }}>
            Completá tu configuración
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Para usar el calendario, primero necesitás configurar:
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%'
        }}>
          {missingFields.map((field, index) => (
            <div key={index} style={{
              background: 'rgba(147, 155, 245, 0.08)',
              border: '1px solid rgba(147, 155, 245, 0.2)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(147, 155, 245, 0.6)',
                flexShrink: 0
              }} />
              <span style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9375rem',
                fontWeight: '500'
              }}>
                {field}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/configuracion"
          className="btn-primary"
          style={{
            marginTop: '0.5rem',
            textDecoration: 'none',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          Ir a Configuración
        </Link>
      </div>
    </div>
  )
}
