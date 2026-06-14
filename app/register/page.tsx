'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, username: form.username, email: form.email, password: form.password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Registration failed')
      return
    }

    // Auto sign-in after successful registration
    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      setError('Account created but auto-sign-in failed. Please log in manually.')
      router.push('/login')
      return
    }

    // New user has no hotel — send to create or join
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">S</div>
          <div className="auth-title">Create account</div>
          <div className="auth-subtitle">Join SyncStay — register your hotel or join a team</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--r-md)', padding: '10px 14px',
              fontSize: 'var(--fs-sm)', color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="name">Full name</label>
            <input id="name" type="text" className="input" placeholder="Jane Smith"
              value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input id="username" type="text" className="input" placeholder="jane_smith"
              value={form.username} onChange={e => update('username', e.target.value)}
              required autoComplete="username"
              pattern="[a-zA-Z0-9_]{3,20}" title="3–20 characters: letters, numbers, underscores" />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 2 }}>
              Used to sign in — letters, numbers and underscores only
            </span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@example.com"
              value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="email" />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="Min 8 chars"
                value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className="input" placeholder="Repeat password"
                value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-lg)' }}>
          <div className="auth-divider">Already have an account?</div>
          <div style={{ marginTop: 'var(--sp-md)' }}>
            <Link href="/login" className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
