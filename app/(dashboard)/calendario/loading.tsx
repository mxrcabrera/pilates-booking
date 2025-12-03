'use client'

export default function CalendarioLoading() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="skeleton-title" style={{ width: '140px', height: '32px' }} />
          <div className="skeleton-line" style={{ width: '180px', height: '16px', marginTop: '8px' }} />
        </div>
      </div>
      <div className="content-card" style={{ minHeight: '500px' }}>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div className="skeleton-button" style={{ width: '40px', height: '40px' }} />
            <div className="skeleton-title" style={{ width: '200px', height: '28px' }} />
            <div className="skeleton-button" style={{ width: '40px', height: '40px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {[...Array(35)].map((_, i) => (
              <div key={i} className="skeleton-line" style={{ height: '80px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
