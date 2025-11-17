import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    accessToken?: string
    refreshToken?: string
  }
}
