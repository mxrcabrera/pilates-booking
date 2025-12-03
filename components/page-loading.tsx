'use client'

export function PageLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '2rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(147, 155, 245, 0.2)',
        borderTopColor: 'rgba(147, 155, 245, 0.9)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  )
}
