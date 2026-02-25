import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../prisma'
import { authConfig } from './auth.config'
import { getTrialEndDate } from '../plans'

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
          // Crear nuevo usuario con trial de 14 días
          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              nombre: profile.name || profile.email.split('@')[0],
              image: (profile as { picture?: string }).picture || null,
              role: 'PROFESOR',
              plan: 'FREE',
              trialEndsAt: getTrialEndDate(),
              planStartedAt: new Date(),
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
        token.role = (user as { role?: string }).role || 'PROFESOR'
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
        session.user.role = token.role as string
      }
      return session
    },
  },
})
