'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PhotoUpload } from '@/components/PhotoUpload'

interface Hotel {
  _id: string; name: string; address: string; phone: string; email: string
  inviteKey: string; logoUrl?: string; logoFileId?: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const [hotel, setHotel]     = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  // Create hotel form (if no hotel yet)
  const [createForm, setCreateForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')

  const isOwner = role === 'hotel_owner' || role === 'super_admin'

  async function loadHotel() {
    const res  = await fetch('/api/hotels')
    const data = await res.json()
    setHotel(data.hotel ?? null)
    setLoading(false)
  }

  useEffect(() => { loadHotel() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!hotel) return
    setMessage(''); setError('')
    setSaving(true)

    const res = await fetch(`/api/hotels/${hotel._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: hotel.name, address: hotel.address, phone: hotel.phone, email: hotel.email }),
    })

    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Save failed'); return }
    setMessage('Hotel details saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleLogoUpload(dataUri: string, filename: string) {
    if (!hotel) return
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUri, filename, folder: hotel._id }),
    })
    const uploadData = await uploadRes.json()
    if (!uploadRes.ok) { setError(uploadData.error); return }

    await fetch(`/api/hotels/${hotel._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoFileId: uploadData.fileId, logoUrl: uploadData.url }),
    })
    setHotel(h => h ? { ...h, logoUrl: uploadData.url } : h)
    setMessage('Logo updated!')
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleRegenKey() {
    if (!hotel) return
    if (!confirm('Regenerate invite key? The old key will immediately stop working.')) return
    setRegenLoading(true)
    const res = await fetch(`/api/hotels/${hotel._id}/invite-key`, { method: 'POST' })
    const data = await res.json()
    setRegenLoading(false)
    if (!res.ok) { setError(data.error); return }
    setHotel(h => h ? { ...h, inviteKey: data.inviteKey } : h)
    setMessage('Invite key regenerated!')
    setTimeout(() => setMessage(''), 3000)
  }

  function copyKey() {
    if (!hotel) return
    navigator.clipboard.writeText(hotel.inviteKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    const res = await fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setCreateError(data.error ?? 'Failed to create hotel'); return }
    loadHotel()
  }

  if (loading) return <div className="page-container flex justify-center" style={{ paddingTop: 80 }}><span className="spinner spinner-lg" /></div>

  // No hotel yet — show create form
  if (!hotel) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Register Your Hotel</h1>
          <p className="page-subtitle">Create your hotel profile to get started with SyncStay</p>
        </div>
        <div className="glass-card" style={{ padding: 'var(--sp-xl)', maxWidth: 560 }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            {createError && <div style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)' }}>{createError}</div>}
            <div className="input-group">
              <label className="input-label" htmlFor="h-name">Hotel Name *</label>
              <input id="h-name" className="input" placeholder="Grand Hyatt Mumbai" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="h-address">Address</label>
              <input id="h-address" className="input" placeholder="123 Marine Drive, Mumbai" value={createForm.address} onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label" htmlFor="h-phone">Phone</label>
                <input id="h-phone" className="input" placeholder="+91 22 1234 5678" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="h-email">Email</label>
                <input id="h-email" type="email" className="input" placeholder="hotel@example.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={creating}>
              {creating ? <span className="spinner" /> : '🏨'}
              {creating ? 'Creating…' : 'Create Hotel'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Hotel Settings</h1>
        <p className="page-subtitle">Manage your hotel profile and team access</p>
      </div>

      {message && (
        <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--r-md)', padding: '10px 16px', fontSize: 'var(--fs-sm)', color: 'var(--green)', marginBottom: 'var(--sp-md)' }}>
          ✓ {message}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', padding: '10px 16px', fontSize: 'var(--fs-sm)', color: 'var(--red)', marginBottom: 'var(--sp-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)', maxWidth: 640 }}>
        {/* Hotel Logo */}
        {isOwner && (
          <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
            <h2 style={{ fontWeight: 800, marginBottom: 'var(--sp-md)', color: 'var(--text-pri)' }}>Hotel Logo</h2>
            <PhotoUpload
              label="Upload Logo"
              previewUrl={hotel.logoUrl ?? undefined}
              onChange={handleLogoUpload}
            />
          </div>
        )}

        {/* Hotel Details */}
        <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
          <h2 style={{ fontWeight: 800, marginBottom: 'var(--sp-md)', color: 'var(--text-pri)' }}>Hotel Details</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="s-name">Hotel Name</label>
              <input id="s-name" className="input" value={hotel.name}
                onChange={e => setHotel(h => h ? { ...h, name: e.target.value } : h)}
                disabled={!isOwner} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="s-address">Address</label>
              <input id="s-address" className="input" value={hotel.address}
                onChange={e => setHotel(h => h ? { ...h, address: e.target.value } : h)}
                disabled={!isOwner} />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label" htmlFor="s-phone">Phone</label>
                <input id="s-phone" className="input" value={hotel.phone}
                  onChange={e => setHotel(h => h ? { ...h, phone: e.target.value } : h)}
                  disabled={!isOwner} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="s-email">Email</label>
                <input id="s-email" type="email" className="input" value={hotel.email}
                  onChange={e => setHotel(h => h ? { ...h, email: e.target.value } : h)}
                  disabled={!isOwner} />
              </div>
            </div>
            {isOwner && (
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                {saving ? <span className="spinner" /> : null}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Invite Key */}
        {isOwner && (
          <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
            <h2 style={{ fontWeight: 800, marginBottom: 'var(--sp-sm)', color: 'var(--text-pri)' }}>Team Invite Key</h2>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
              Share this key with employees — they can enter it on the Join page to be added to your hotel as staff.
            </p>
            <div className="flex gap-md items-center flex-wrap">
              <div className="invite-key">{hotel.inviteKey}</div>
              <div className="flex gap-sm">
                <button className="btn btn-ghost btn-sm" onClick={copyKey}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleRegenKey} disabled={regenLoading}>
                  {regenLoading ? <span className="spinner" /> : '🔄'} Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
