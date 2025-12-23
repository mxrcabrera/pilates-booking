import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de autenticación global
 *
 * Protege todas las rutas excepto las públicas.
 * Redirige a /login si no hay sesión válida.
 */
export function middleware(request: NextRequest) {
  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/login',
    '/api/auth',
    '/api/portal',
    '/reservar',
    '/privacy',
    '/terms',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
  ]

  const { pathname } = request.nextUrl

  // Verificar si es una ruta pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Permitir rutas públicas
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Verificar si tiene cookie de auth (credentials o NextAuth)
  const authToken = request.cookies.get('auth-token')
  const nextAuthSession =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token')

  const hasValidSession = authToken || nextAuthSession

  // Página raíz: redirigir según estado de auth (evita doble round-trip)
  if (pathname === '/') {
    if (hasValidSession) {
      // La redirección según rol se hace después de verificar el rol en el cliente
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Agregar /api/alumno a rutas protegidas que requieren autenticación
  // pero no bloqueamos acceso aquí, solo dejamos pasar

  if (!hasValidSession) {
    // Para APIs, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Para páginas, redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
