import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcrypt'
import type { NextAuthConfig, User } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'

// Custom adapter que mapea name → nombre
function customPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma) as Adapter

  return {
    ...baseAdapter,
    async createUser(data) {
      const { name, ...rest } = data
      const userData = {
        ...rest,
        nombre: name || '',
      }

      const user = await prisma.user.create({
        data: userData,
      })

      return {
        ...user,
        name: user.nombre,
        emailVerified: user.emailVerified || null,
      }
    },
  }
}

export const authConfig: NextAuthConfig = {
  adapter: customPrismaAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          image: user.image,
        } as User
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      // Pass role to session
      if (token.role) {
        (session.user as any).role = token.role
      }
      // Pass tokens to session for Google Calendar API
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken
      }
      if (token.refreshToken) {
        (session as any).refreshToken = token.refreshToken
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.sub = user.id

        // For Google OAuth first-time login, set default values
        if (account?.provider === 'google' && user.email) {
          // Guardar access_token y refresh_token para Google Calendar API
          if (account.access_token) {
            token.accessToken = account.access_token
          }
          if (account.refresh_token) {
            token.refreshToken = account.refresh_token
          }

          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          // Check if user needs defaults (newly created by PrismaAdapter)
          if (dbUser && !dbUser.telefono) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                horasAnticipacionMinima: 1,
                maxAlumnosPorClase: 4,
                horarioMananaInicio: '08:00',
                horarioMananaFin: '14:00',
                horarioTardeInicio: '17:00',
                horarioTardeFin: '22:00',
              },
            })
          }

          // Store role in token
          if (dbUser) {
            token.role = dbUser.role
          }
        }
      }

      // Always fetch latest role from database
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLoggedIn = !!auth?.user

      // Rutas públicas
      const isPublicRoute = pathname === '/login' || pathname === '/register'
      const isOnboarding = pathname === '/onboarding'

      // Si está logueado y trata de acceder a login/register, redirigir según rol
      if (isLoggedIn && isPublicRoute) {
        const user = await prisma.user.findUnique({
          where: { email: auth.user.email! },
          select: { role: true },
        })

        if (user?.role === 'PROFESOR') {
          return Response.redirect(new URL('/dashboard', request.url))
        } else if (user?.role === 'ALUMNO') {
          return Response.redirect(new URL('/alumno/dashboard', request.url))
        }
      }

      // Si no está logueado y trata de acceder a rutas protegidas
      if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL('/login', request.url))
      }

      // Si está logueado, verificar que tenga rol asignado
      if (isLoggedIn && !isPublicRoute && !isOnboarding) {
        const user = await prisma.user.findUnique({
          where: { email: auth.user.email! },
          select: { role: true },
        })

        // Si no tiene rol o es el rol por defecto y no tiene configuración, enviar a onboarding
        if (!user) {
          return Response.redirect(new URL('/onboarding', request.url))
        }
      }

      return true
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  debug: true,
}
