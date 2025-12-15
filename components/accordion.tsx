'use client'

import { useState, ReactNode, createContext, useContext } from 'react'
import { ChevronDown } from 'lucide-react'

// Context para manejar accordions exclusivos
const AccordionGroupContext = createContext<{
  openId: string | null
  setOpenId: (id: string | null) => void
} | null>(null)

interface AccordionGroupProps {
  children: ReactNode
  defaultOpenId?: string
}

export function AccordionGroup({ children, defaultOpenId }: AccordionGroupProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null)

  return (
    <AccordionGroupContext.Provider value={{ openId, setOpenId }}>
      <div className="settings-accordion-container">
        {children}
      </div>
    </AccordionGroupContext.Provider>
  )
}

interface AccordionProps {
  id: string
  title: string
  icon?: ReactNode
  children: ReactNode
}

export function Accordion({ id, title, icon, children }: AccordionProps) {
  const context = useContext(AccordionGroupContext)

  if (!context) {
    throw new Error('Accordion must be used within AccordionGroup')
  }

  const { openId, setOpenId } = context
  const isOpen = openId === id

  const handleToggle = () => {
    setOpenId(isOpen ? null : id)
  }

  return (
    <div className="accordion-item">
      <button
        type="button"
        onClick={handleToggle}
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
