'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error, error.digest ? `[digest: ${error.digest}]` : '')
  }, [error])

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>Algo salió mal</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {error.message || 'Ocurrió un error inesperado.'}
          </p>
          <button
            onClick={reset}
            style={{ padding: '0.75rem 1.5rem', background: '#6E7DF5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
