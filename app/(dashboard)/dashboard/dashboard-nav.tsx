'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Users, Settings, LayoutDashboard, LogOut, Menu, X, Clock } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

type Profesor = {
  id: string
  nombre: string
  email: string
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/calendario', icon: Calendar, label: 'Calendario' },
  { href: '/alumnos', icon: Users, label: 'Alumnos' },
  { href: '/configuracion', icon: Settings, label: 'Configuración' },
]

export function DashboardNav({ profesor }: { profesor: Profesor }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isConfigPage = pathname === '/configuracion'

  const handleAvatarClick = () => {
    if (isConfigPage) {
      // From config page, navigate to perfil tab with hash
      router.push('/configuracion#perfil')
    } else {
      // From other pages, navigate to config
      router.push('/configuracion')
    }
  }

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
            <div className="user-info" style={{ cursor: 'pointer' }} onClick={handleAvatarClick}>
              <div className="user-avatar">
                {profesor?.nombre?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="user-details desktop-only">
                <p className="user-name">{profesor?.nombre}</p>
                <p className="user-email">{profesor?.email}</p>
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
              <div
                className="user-info"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleAvatarClick()
                  setMobileMenuOpen(false)
                }}
              >
                <div className="user-avatar">
                  {profesor?.nombre?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="user-details">
                  <p className="user-name">{profesor?.nombre}</p>
                  <p className="user-email">{profesor?.email}</p>
                </div>
              </div>
            </div>

            <div className="mobile-menu-items">
              {isConfigPage ? (
                <>
                  <button
                    className="mobile-menu-link"
                    onClick={() => {
                      router.push('/configuracion#horarios')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Clock size={20} />
                    <span>Horarios</span>
                  </button>
                  <button
                    className="mobile-menu-link"
                    onClick={() => {
                      router.push('/configuracion#preferencias')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Settings size={20} />
                    <span>Preferencias</span>
                  </button>
                </>
              ) : (
                navItems.map((item) => {
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
                })
              )}
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