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
      // For OAuth, create or update the user
      if (account?.provider === 'google' && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })

        if (!existingUser) {
          // Create new user with 14-day trial
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
          // Assign the id to the user object for JWT usage
          user.id = newUser.id
        } else {
          // Existing user - assign the id
          user.id = existingUser.id
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // First time creating the token (after sign in)
      if (user && user.id) {
        token.sub = user.id
        token.role = (user as { role?: string }).role || 'PROFESOR'
      }

      // Save Google tokens for Calendar API
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
