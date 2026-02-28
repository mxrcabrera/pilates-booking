'use client'

import { useEffect } from 'react'

export default function PagosError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Pagos error:', error, error.digest ? `[digest: ${error.digest}]` : '')
  }, [error])

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="content-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
          Error en Pagos
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem' }}>
          Ocurrió un error inesperado. Por favor, intenta de nuevo.
        </p>
        <button onClick={reset} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    </div>
  )
}
