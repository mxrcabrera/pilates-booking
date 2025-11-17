import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface PreferencesRequiredProps {
  missingFields: string[]
}

export function PreferencesRequired({ missingFields }: PreferencesRequiredProps) {
  return (
    <div className="page-container">
      <div className="content-card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 180, 100, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={32} style={{ color: 'rgba(255, 180, 100, 0.9)' }} />
          </div>

          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '0.5rem'
            }}>
              Completá tu configuración
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Para acceder a esta sección, necesitás completar tu configuración primero.
            </p>
          </div>

          {missingFields.length > 0 && (
            <div style={{
              background: 'rgba(255, 180, 100, 0.05)',
              border: '1px solid rgba(255, 180, 100, 0.2)',
              borderRadius: '12px',
              padding: '1.25rem',
              width: '100%',
              textAlign: 'left'
            }}>
              <p style={{
                color: 'rgba(255, 180, 100, 0.9)',
                fontWeight: '600',
                marginBottom: '0.75rem',
                fontSize: '0.875rem'
              }}>
                Campos faltantes:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {missingFields.map((field, index) => (
                  <li key={index} style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(255, 180, 100, 0.6)'
                    }} />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/configuracion"
            className="btn-primary"
            style={{
              marginTop: '0.5rem',
              textDecoration: 'none'
            }}
          >
            Ir a Configuración
          </Link>
        </div>
      </div>
    </div>
  )
}
