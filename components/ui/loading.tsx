'use client'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizeClasses = {
  sm: 'loading-spinner-sm',
  md: 'loading-spinner-md',
  lg: 'loading-spinner-lg'
}

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="page-loading-wrapper">
      <div className="page-loading-spinner" />
    </div>
  )
}

export function InlineLoading({ text = 'Cargando...' }: { text?: string }) {
  return (
    <span className="inline-loading">
      <span className="inline-loading-spinner" />
      {text}
    </span>
  )
}
