import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Import from auth-EDGE — this file has NO mongoose/DB imports, Edge-safe JWT only.
// DO NOT change this to '@/lib/auth' — that file imports mongoose and will break the Edge bundle.
import { auth } from '@/lib/auth-edge'

/**
 * Route protection middleware.
 *
 * IMPORTANT: This file runs in the Edge Runtime.
 * It must NOT import anything that uses Mongoose, Node.js APIs,
 * or eval/dynamic code (e.g. mongoose browser bundle).
 *
 * NextAuth v5 `auth()` in middleware uses the JWT cookie directly
 * with no database call — safe for Edge.
 *
 * Redirect rules:
 *  - Unauthenticated accessing protected route → /login
 *  - Non-super-admin accessing /super/* → /dashboard
 *  - Already-authenticated accessing /login, /register, /join → /dashboard or /super/dashboard
 */

export default auth((req: any) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  const isAuthed     = !!session?.user
  const role: string = session?.user?.role ?? ''

  // Auth-only routes (redirect away when already logged in)
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/join'

  if (isAuthRoute && isAuthed) {
    const dest = role === 'super_admin' ? '/super/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Protected hotel app routes
  const protectedPrefixes = ['/dashboard', '/rooms', '/checkin', '/bookings', '/employees', '/settings']
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Super admin routes — must be super_admin role
  if (pathname.startsWith('/super') && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/super') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Only run on paths that need protection. Exclude API routes and static files.
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/checkin/:path*',
    '/bookings/:path*',
    '/employees/:path*',
    '/settings/:path*',
    '/super/:path*',
    '/login',
    '/register',
    '/join',
  ],
}
