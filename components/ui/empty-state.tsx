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
    <div className="empty-state-wrapper">
      <div className="empty-state-content">
        <div className="empty-state-icon-circle">
          {icon}
        </div>

        <div className="empty-state-text">
          <h2 className="empty-state-title">
            {title}
          </h2>
          <p className="empty-state-description">
            {description}
          </p>
        </div>

        {actionLabel && (actionHref || onAction) && (
          actionHref ? (
            <Link
              href={actionHref}
              className="btn-primary empty-state-action"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="btn-primary empty-state-action"
            >
              {actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  )
}
