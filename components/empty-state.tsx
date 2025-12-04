import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '2rem'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center',
        maxWidth: '360px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(147, 155, 245, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '2px solid rgba(147, 155, 245, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>

        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '0.5rem'
          }}>
            {title}
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.9375rem',
            lineHeight: '1.5'
          }}>
            {description}
          </p>
        </div>

        {actionLabel && (actionHref || onAction) && (
          actionHref ? (
            <Link
              href={actionHref}
              className="btn-primary"
              style={{
                textDecoration: 'none',
                marginTop: '0.5rem'
              }}
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  )
}
