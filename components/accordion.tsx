'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export function Accordion({ title, icon, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="accordion-item">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="accordion-header"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {icon}
          <span className="accordion-title">{title}</span>
        </div>
        <ChevronDown
          size={20}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'rgba(147, 155, 245, 0.9)'
          }}
        />
      </button>

      <div
        className="accordion-content"
        style={{
          maxHeight: isOpen ? '5000px' : '0',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease'
        }}
      >
        <div className="accordion-body">
          {children}
        </div>
      </div>
    </div>
  )
}
