'use client'

export default function AlumnosLoading() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="skeleton-title" style={{ width: '120px', height: '32px' }} />
          <div className="skeleton-line" style={{ width: '100px', height: '16px', marginTop: '8px' }} />
        </div>
        <div className="skeleton-button" style={{ width: '140px', height: '40px' }} />
      </div>
      <div className="content-card">
        <div style={{ padding: '1rem' }}>
          <div className="skeleton-line" style={{ width: '100%', height: '44px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-line" style={{ width: '100%', height: '56px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
