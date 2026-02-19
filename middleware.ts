import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// En producción, JWT_SECRET es requerido
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const secret = new TextEncoder().encode(jwtSecret || 'dev-secret-only-for-local')

async function getRoleFromToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload as { role?: string }).role || 'PROFESOR'
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas estáticas - siempre permitir
  const staticPaths = [
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
  ]

  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Obtener tokens de sesión
  const authToken = request.cookies.get('auth-token')?.value
  const nextAuthSession =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  // Obtener rol del token JWT (solo para auth-token)
  let userRole: string | null = null
  let hasValidToken = false

  if (authToken) {
    userRole = await getRoleFromToken(authToken)
    hasValidToken = userRole !== null
  }

  // Sesión válida: token JWT válido O sesión de NextAuth
  const hasSession = hasValidToken || !!nextAuthSession

  // ===========================================
  // RUTAS PÚBLICAS (sin autenticación requerida)
  // ===========================================
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/callback',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers',
    '/reservar',
    '/privacy',
    '/terms',
  ]

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // ===========================================
  // PÁGINA DE LOGIN - Redirigir si ya está logueado
  // ===========================================
  if (pathname === '/login' || pathname.startsWith('/login')) {
    if (hasSession && userRole) {
      // Usuario logueado intentando acceder a login -> redirigir a su dashboard
      const redirectUrl = userRole === 'ALUMNO' ? '/alumno' : '/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    // No logueado -> permitir acceso a login
    return NextResponse.next()
  }

  // Permitir rutas públicas sin verificación adicional
  if (isPublicPath) {
    return NextResponse.next()
  }

  // ===========================================
  // PÁGINA RAÍZ - Redirigir según estado
  // ===========================================
  if (pathname === '/') {
    if (hasSession && userRole) {
      const redirectUrl = userRole === 'ALUMNO' ? '/alumno' : '/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ===========================================
  // RUTAS PROTEGIDAS - Requieren autenticación
  // ===========================================
  if (!hasSession) {
    // Sin sesión
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ===========================================
  // VALIDACIÓN DE ROLES EN RUTAS
  // ===========================================

  // Rutas de ALUMNO - Solo para rol ALUMNO
  // Note: Use exact /alumno path to avoid matching /alumnos (profesor route)
  if (pathname === '/alumno' || pathname.startsWith('/alumno/') || pathname.startsWith('/api/alumno')) {
    if (userRole && userRole !== 'ALUMNO') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Acceso denegado', redirect: '/dashboard' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Rutas de PROFESOR (dashboard, calendario, alumnos, etc.) - Solo para rol PROFESOR
  const profesorPaths = ['/dashboard', '/calendario', '/alumnos', '/pagos', '/configuracion', '/planes', '/reportes', '/equipo', '/perfil', '/onboarding']
  const profesorApiPaths = ['/api/v1/']

  const isProfesorRoute = profesorPaths.some(path => pathname.startsWith(path))
  const isProfesorApi = profesorApiPaths.some(path => pathname.startsWith(path))

  if (isProfesorRoute || isProfesorApi) {
    if (userRole && userRole === 'ALUMNO') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Acceso denegado', redirect: '/alumno' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/alumno', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
