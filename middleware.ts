import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { decode } from 'next-auth/jwt'

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} environment variable is required`)
  return value
}

const jwtSecret = getRequiredEnv('JWT_SECRET')
const secret = new TextEncoder().encode(jwtSecret)
const authSecret = getRequiredEnv('AUTH_SECRET')

async function getRoleFromToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload as { role?: string }).role || 'PROFESOR'
  } catch {
    return null
  }
}

async function getRoleFromNextAuthToken(
  token: string,
  cookieName: string
): Promise<string | null> {
  try {
    const decoded = await decode({ token, secret: authSecret, salt: cookieName })
    if (!decoded) return null
    return (decoded as { role?: string }).role || 'PROFESOR'
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
  const secureCookieName = '__Secure-next-auth.session-token'
  const plainCookieName = 'next-auth.session-token'
  const nextAuthToken = request.cookies.get(secureCookieName)?.value
  const nextAuthTokenPlain = request.cookies.get(plainCookieName)?.value

  let userRole: string | null = null
  let hasValidToken = false

  if (authToken) {
    userRole = await getRoleFromToken(authToken)
    hasValidToken = userRole !== null
  }

  if (!hasValidToken && (nextAuthToken || nextAuthTokenPlain)) {
    const token = nextAuthToken || nextAuthTokenPlain!
    const salt = nextAuthToken ? secureCookieName : plainCookieName
    userRole = await getRoleFromNextAuthToken(token, salt)
    hasValidToken = userRole !== null
  }

  const hasSession = hasValidToken

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
    const allowedPrefixes = ['/dashboard', '/calendario', '/alumnos', '/pagos', '/configuracion', '/planes', '/reportes', '/equipo', '/perfil', '/onboarding', '/alumno']
    if (allowedPrefixes.some(p => pathname.startsWith(p))) {
      loginUrl.searchParams.set('callbackUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // ===========================================
  // VALIDACIÓN DE ROLES EN RUTAS
  // ===========================================

  // Rutas de ALUMNO - Solo para rol ALUMNO
  // Note: Use exact /alumno path and trailing slash to avoid matching /alumnos (profesor route)
  if (pathname === '/alumno' || pathname.startsWith('/alumno/') || pathname.startsWith('/api/v1/alumno/')) {
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
    && !pathname.startsWith('/api/v1/alumno/')

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
