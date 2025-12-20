'use client'

import { ReactNode } from 'react'

interface SectionWrapperProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}

export function SectionWrapper({
  title,
  description,
  children,
  className = '',
  headerAction
}: SectionWrapperProps) {
  return (
    <div className={`settings-section ${className}`}>
      <div className="section-content">
        {(title || description || headerAction) && (
          <div className="section-header">
            <div>
              {title && <h2>{title}</h2>}
              {description && <p className="section-description">{description}</p>}
            </div>
            {headerAction}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
