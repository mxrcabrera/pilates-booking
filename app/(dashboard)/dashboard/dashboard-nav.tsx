'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Users, Settings, LayoutDashboard, LogOut, Menu, X, DollarSign, Crown, User, UsersRound, BarChart3 } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import type { Profesor } from '@/lib/types'

interface NavItem {
  href: string
  icon: typeof LayoutDashboard
  label: string
  requiresFeature?: 'multiUsuarios' | 'reportesBasicos'
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/calendario', icon: Calendar, label: 'Calendario' },
  { href: '/alumnos', icon: Users, label: 'Alumnos' },
  { href: '/pagos', icon: DollarSign, label: 'Pagos' },
  { href: '/reportes', icon: BarChart3, label: 'Reportes', requiresFeature: 'reportesBasicos' },
  { href: '/equipo', icon: UsersRound, label: 'Equipo', requiresFeature: 'multiUsuarios' },
  { href: '/configuracion', icon: Settings, label: 'Configuración' },
]

interface Features {
  multiUsuarios?: boolean
  reportesBasicos?: boolean
}

export function DashboardNav({ profesor, features }: { profesor: Profesor; features?: Features }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresFeature) return true
    return features?.[item.requiresFeature] === true
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAvatarClick = () => {
    setUserMenuOpen(!userMenuOpen)
  }

  return (
    <>
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/dashboard" className="nav-logo">
            Pilates Booking
          </Link>

          {/* Desktop nav - centrado */}
          <div className="nav-links desktop-only">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="nav-user">
            <div className="user-menu-container desktop-only" ref={userMenuRef}>
              <button className="user-avatar-btn" onClick={handleAvatarClick}>
                {profesor?.nombre?.charAt(0).toUpperCase() || 'P'}
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{profesor?.nombre}</span>
                    <span className="user-dropdown-email">{profesor?.email}</span>
                  </div>
                  <div className="user-dropdown-divider" />
                  <div className="user-dropdown-plan">
                    <div className="plan-badge-row">
                      <Crown size={14} />
                      <span className="plan-name">{profesor?.planName || 'Free'}</span>
                      {profesor?.inTrial && (
                        <span className="trial-badge">Trial</span>
                      )}
                    </div>
                    {profesor?.inTrial && profesor.trialDaysLeft !== undefined && profesor.trialDaysLeft > 0 && (
                      <p className="trial-days">{profesor.trialDaysLeft} días restantes</p>
                    )}
                    <Link href="/planes" className="upgrade-link" onClick={() => setUserMenuOpen(false)}>
                      Ver planes
                    </Link>
                  </div>
                  <div className="user-dropdown-divider" />
                  <Link href="/perfil" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="user-dropdown-item logout">
                      <LogOut size={16} />
                      <span>Cerrar sesión</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Mobile: solo avatar sin dropdown */}
            <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => router.push('/perfil')}>
                <span className="avatar-letter">{profesor?.nombre?.charAt(0).toUpperCase() || 'P'}</span>
              </div>
            </div>

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
                  router.push('/perfil')
                  setMobileMenuOpen(false)
                }}
              >
                <div className="user-avatar">
                  <span className="avatar-letter">{profesor?.nombre?.charAt(0).toUpperCase() || 'P'}</span>
                </div>
                <div className="user-details">
                  <p className="user-name">{profesor?.nombre}</p>
                  <p className="user-email">{profesor?.email}</p>
                </div>
              </div>
              <div className="mobile-plan-info">
                <div className="plan-badge-row">
                  <Crown size={14} />
                  <span className="plan-name">{profesor?.planName || 'Free'}</span>
                  {profesor?.inTrial && <span className="trial-badge">Trial</span>}
                </div>
                {profesor?.inTrial && profesor.trialDaysLeft !== undefined && profesor.trialDaysLeft > 0 && (
                  <p className="trial-days">{profesor.trialDaysLeft} días restantes</p>
                )}
                <Link href="/planes" className="upgrade-link" onClick={() => setMobileMenuOpen(false)}>
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="mobile-menu-items">
              {visibleNavItems.map((item) => {
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