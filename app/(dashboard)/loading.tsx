'use client'

export default function DashboardLoading() {
  return (
    <div className="page-container">
      <div className="loading-skeleton">
        <div className="skeleton-header">
          <div className="skeleton-title" />
          <div className="skeleton-button" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      </div>
    </div>
  )
}
