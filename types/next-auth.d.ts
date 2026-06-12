import NextAuth from 'next-auth'

/**
 * Augments the NextAuth module to include custom fields
 * (role, hotelId, id) on the Session and User types.
 * This allows TypeScript to type-check session.user.role etc.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      hotelId: string | null
    }
  }

  interface User {
    id: string
    role: string
    hotelId: string | null
  }
}
