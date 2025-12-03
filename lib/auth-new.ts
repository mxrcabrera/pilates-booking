import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Para OAuth, crear o actualizar el usuario
      if (account?.provider === 'google' && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })

        if (!existingUser) {
          // Crear nuevo usuario
          await prisma.user.create({
            data: {
              email: profile.email,
              nombre: profile.name || profile.email.split('@')[0],
              image: (profile as any).picture || null,
              role: 'PROFESOR', // Default, se cambia en onboarding
            },
          })
        }
      }
      return true
    },
  },
})
