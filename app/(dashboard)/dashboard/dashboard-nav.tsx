'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

type Profesora = {
  id: string
  nombre: string
  email: string
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/calendario', icon: Calendar, label: 'Calendario' },
  { href: '/alumnos', icon: Users, label: 'Alumnas' },
  { href: '/configuracion', icon: Settings, label: 'Configuración' },
]

export function DashboardNav({ profesora }: { profesora: Profesora }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/dashboard" className="nav-logo">
              Pilates Booking
            </Link>
            
            {/* Desktop nav */}
            <div className="nav-links desktop-only">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="nav-user">
            <div className="user-info">
              <div className="user-avatar">
                {profesora?.nombre?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="user-details desktop-only">
                <p className="user-name">{profesora?.nombre}</p>
                <p className="user-email">{profesora?.email}</p>
              </div>
            </div>
            
            <form action={logout} className="desktop-only">
              <button type="submit" className="logout-btn" title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </form>

            {/* Mobile menu button */}
            <button 
              className="mobile-menu-btn mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="user-info">
                <div className="user-avatar">
                  {profesora?.nombre?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="user-details">
                  <p className="user-name">{profesora?.nombre}</p>
                  <p className="user-email">{profesora?.email}</p>
                </div>
              </div>
            </div>

            <div className="mobile-menu-items">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-menu-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="mobile-menu-footer">
              <form action={logout}>
                <button type="submit" className="mobile-logout-btn">
                  <LogOut size={20} />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}