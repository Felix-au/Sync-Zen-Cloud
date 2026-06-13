/**
 * Edge-compatible NextAuth configuration.
 *
 * This file is ONLY for middleware.ts (Edge Runtime).
 * It does NOT import mongoose, mongodb, or any models.
 * It only needs the JWT secret to verify the token cookie.
 *
 * The full auth config (with Credentials provider + DB access) lives
 * in lib/auth.ts and is only imported by Node.js API routes.
 */
import NextAuth from 'next-auth'

export const { auth } = NextAuth({
  providers: [], // No providers needed — we only verify the existing JWT here
  callbacks: {
    async jwt({ token }) { return token },
    async session({ session, token }) {
      if (token) {
        session.user.id      = token.id as string
        session.user.role    = token.role as string
        session.user.hotelId = (token.hotelId as string) ?? null
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})
