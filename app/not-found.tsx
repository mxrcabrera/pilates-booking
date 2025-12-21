import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="page-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <div className="content-card" style={{
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          Página no encontrada
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '1.5rem'
        }}>
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
