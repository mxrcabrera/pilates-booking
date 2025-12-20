import Link from 'next/link'
import { Settings } from 'lucide-react'

interface PreferencesRequiredProps {
  missingFields: string[]
}

export function PreferencesRequired({ missingFields }: PreferencesRequiredProps) {
  return (
    <div className="preferences-required-page">
      <div className="preferences-required-content">
        <div className="preferences-required-icon">
          <Settings size={36} />
        </div>

        <div className="preferences-required-text">
          <h2>Completá tu configuración</h2>
          <p>Para usar el calendario, primero necesitás configurar:</p>
        </div>

        <div className="preferences-required-list">
          {missingFields.map((field, index) => (
            <div key={index} className="preferences-required-item">
              <div className="preferences-required-bullet" />
              <span>{field}</span>
            </div>
          ))}
        </div>

        <Link href="/configuracion" className="preferences-required-btn">
          Ir a Configuración
        </Link>
      </div>
    </div>
  )
}
