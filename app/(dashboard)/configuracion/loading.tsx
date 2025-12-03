'use client'

export default function ConfiguracionLoading() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="skeleton-title" style={{ width: '160px', height: '32px' }} />
          <div className="skeleton-line" style={{ width: '200px', height: '16px', marginTop: '8px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="content-card">
            <div style={{ padding: '1.5rem' }}>
              <div className="skeleton-title" style={{ width: '180px', height: '24px', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton-line" style={{ width: '100%', height: '44px' }} />
                <div className="skeleton-line" style={{ width: '100%', height: '44px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
