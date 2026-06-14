import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
// These imports are Node.js only — this file is only used in API routes (not middleware).
// Middleware uses lib/auth-edge.ts which has no DB imports.

/**
 * NextAuth v5 configuration.
 *
 * Strategy: Credentials provider with email + password.
 * Session strategy: JWT (no database session storage).
 *
 * IMPORTANT — Edge Runtime compatibility:
 * The `auth` export from this file is used in middleware.ts.
 * NextAuth v5's middleware auth reads the JWT cookie ONLY — it does not
 * call authorize() or touch the database. So importing this in middleware
 * is safe as long as we DON'T import mongoose/mongodb inside the NextAuth
 * config object itself at module evaluation time.
 *
 * The authorize() function runs only in Node.js API routes, never in Edge.
 *
 * The JWT payload carries userId, role, hotelId and name so API routes
 * can authorise without a DB lookup on every request.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * authorize() — only called from /api/auth/[...nextauth] POST (Node.js runtime).
       * Never called from Edge middleware.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const identifier = (credentials.email as string).toLowerCase().trim()

        // Dynamic import ensures Mongoose is NEVER bundled into the Edge chunk
        const { connectDB }     = await import('@/lib/mongodb')
        const { default: User } = await import('@/lib/models/User')

        await connectDB()

        // Allow sign-in with either email address or username
        const user = await User.findOne({
          $or: [{ email: identifier }, { username: identifier }],
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        return {
          id:      user._id.toString(),
          email:   user.email,
          name:    user.name,
          role:    user.role,
          hotelId: user.hotelId?.toString() ?? null,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * jwt — persists extra fields into the token so they're available
     * on every request without hitting the DB.
     *
     * On trigger='update' (called by useSession update()) we re-read the
     * user from the DB so that changes like hotelId / role promotion are
     * reflected in the token without requiring a full sign-out/sign-in.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in — populate token from the credentials authorize() return value
        token.id      = user.id
        token.role    = (user as any).role
        token.hotelId = (user as any).hotelId
      }

      if (trigger === 'update' && token.id) {
        // Session refresh requested (e.g. after hotel creation) — sync from DB
        const { connectDB }     = await import('@/lib/mongodb')
        const { default: User } = await import('@/lib/models/User')
        await connectDB()
        const fresh = await User.findById(token.id).select('role hotelId').lean() as any
        if (fresh) {
          token.role    = fresh.role
          token.hotelId = fresh.hotelId?.toString() ?? null
        }
      }

      return token
    },

    /**
     * session — shapes what useSession() / auth() returns.
     * Transfers token fields into the session object.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id      = token.id as string
        session.user.role    = token.role as string
        session.user.hotelId = (token.hotelId as string) ?? null
      }
      return session
    },
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 }, // 30 days, renews daily

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
})
