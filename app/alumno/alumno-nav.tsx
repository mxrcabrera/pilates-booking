'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Settings, LayoutDashboard, LogOut, Menu, X, User, Search } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

type UserData = {
  id: string
  nombre: string
  email: string
}

const navItems = [
  { href: '/alumno', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/alumno/reservar', icon: Search, label: 'Reservar' },
  { href: '/alumno/mis-clases', icon: Calendar, label: 'Mis Clases' },
  { href: '/alumno/configuracion', icon: Settings, label: 'Mi Perfil' },
]

export function AlumnoNav({ user }: { user: UserData }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/alumno" className="nav-logo">
            Pilates Booking
          </Link>

          <div className="nav-links desktop-only">
            {navItems.map((item) => {
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
              <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user?.nombre?.charAt(0).toUpperCase() || 'A'}
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{user?.nombre}</span>
                    <span className="user-dropdown-email">{user?.email}</span>
                  </div>
                  <div className="user-dropdown-divider" />
                  <Link href="/alumno/configuracion" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
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

            <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => router.push('/alumno/configuracion')}>
                <span className="avatar-letter">{user?.nombre?.charAt(0).toUpperCase() || 'A'}</span>
              </div>
            </div>

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
                  router.push('/alumno/configuracion')
                  setMobileMenuOpen(false)
                }}
              >
                <div className="user-avatar">
                  <span className="avatar-letter">{user?.nombre?.charAt(0).toUpperCase() || 'A'}</span>
                </div>
                <div className="user-details">
                  <p className="user-name">{user?.nombre}</p>
                  <p className="user-email">{user?.email}</p>
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
