'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const params  = useSearchParams()
  const hint    = params.get('hint')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password')
      return
    }

    // Redirect based on role — handled by middleware after sign-in
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">S</div>
          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">Sign in to SyncStay</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {hint && (
            <div style={{
              background: 'var(--green-dim)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              fontSize: 'var(--fs-sm)',
              color: 'var(--green)',
              marginBottom: 'var(--sp-sm)',
            }}>
              ✓ {hint}
            </div>
          )}
          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              fontSize: 'var(--fs-sm)',
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              className="input"
              placeholder="you@example.com or your_username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-lg)' }}>
          <div className="auth-divider">Don&apos;t have an account?</div>
          <div style={{ marginTop: 'var(--sp-md)' }}>
            <Link href="/register" className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
