import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../prisma'
import { authConfig } from './auth.config'

// NextAuth types don't include custom fields like role, accessToken, refreshToken
// These are added via type augmentation in types/next-auth.d.ts but callbacks need explicit casting
/* eslint-disable @typescript-eslint/no-explicit-any */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account, profile }) {
      // Para OAuth, crear o actualizar el usuario
      if (account?.provider === 'google' && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })

        if (!existingUser) {
          // Crear nuevo usuario
          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              nombre: profile.name || profile.email.split('@')[0],
              image: (profile as any).picture || null,
              role: 'PROFESOR',
            },
          })
          // Asignar el id al objeto user para que se use en el JWT
          user.id = newUser.id
        } else {
          // Usuario existente - asignar el id
          user.id = existingUser.id
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Primera vez que se crea el token (después del sign in)
      if (user && user.id) {
        token.sub = user.id
        token.role = (user as any).role || 'PROFESOR'
      }

      // Guardar tokens de Google para Calendar API
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token
      }

      return token
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      if (token.role) {
        (session.user as any).role = token.role
      }
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken
      }
      if (token.refreshToken) {
        (session as any).refreshToken = token.refreshToken
      }
      return session
    },
  },
})
