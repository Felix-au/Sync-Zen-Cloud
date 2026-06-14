'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  _id: string
  bookingReference: string
  checkInTime: string
  checkOutDate: string
  status: string
  nights: number
  guests: Array<{ name: string; isPrimary: boolean }>
  roomIds: Array<{ roomNumber: string; roomType: string }>
  createdBy: { name: string }
}

const STATUS_CLASS: Record<string, string> = {
  checked_in:  'badge-green',
  checked_out: 'badge-muted',
  cancelled:   'badge-red',
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  async function load(s = status, q = search, p = page) {
    setLoading(true)
    const params = new URLSearchParams({ limit: '20', page: String(p) })
    if (s) params.set('status', s)
    if (q) params.set('search', q)
    const res  = await fetch(`/api/bookings?${params}`)
    const data = await res.json()
    setBookings(data.bookings ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(status, search, 1)
  }

  async function handleCheckout(id: string, ref: string) {
    if (!confirm(`Check out booking ${ref}?`)) return
    const res = await fetch(`/api/bookings/${id}/checkout`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    load()
  }

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/checkin')}>✚ New Check-In</button>
      </div>

      {/* Filters */}
      <div className="flex gap-md flex-wrap mb-lg items-center">
        <form onSubmit={handleSearch} className="flex gap-sm flex-1">
          <input
            className="input"
            placeholder="Search by reference or guest name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <button type="submit" className="btn btn-ghost btn-sm">Search</button>
          {search && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPage(1); load(status, '', 1) }}>Clear</button>}
        </form>
        <div className="flex gap-sm">
          {[['', 'All'], ['checked_in', 'Active'], ['checked_out', 'Checked Out'], ['cancelled', 'Cancelled']].map(([val, label]) => (
            <button
              key={val}
              className={`btn btn-sm ${status === val ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setStatus(val); setPage(1); load(val, search, 1) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}>
          <span className="spinner spinner-lg" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">📋</span>
          <div className="empty-title">No bookings found</div>
          <div className="empty-text">Try adjusting your filters or create a new check-in.</div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Primary Guest</th>
                  <th>Room(s)</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Nights</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const primary = b.guests.find(g => g.isPrimary) ?? b.guests[0]
                  const rooms = (b.roomIds as any[]).map(r => r.roomNumber ?? r).join(', ')
                  return (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {b.bookingReference}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-pri)' }}>{primary?.name}</td>
                      <td>{rooms}</td>
                      <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(b.checkInTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</td>
                      <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(b.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</td>
                      <td>{b.nights}</td>
                      <td><span className={`badge ${STATUS_CLASS[b.status] ?? 'badge-muted'}`}>{b.status.replace('_', ' ')}</span></td>
                      <td>
                        <div className="flex gap-xs">
                          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/bookings/${b._id}`)}>View</button>
                          {b.status === 'checked_in' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleCheckout(b._id, b.bookingReference)}>Check Out</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-sm" style={{ padding: 'var(--sp-md)' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => { setPage(p => p-1); load(status, search, page-1) }}>← Prev</button>
              <span style={{ padding: '6px 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-mute)' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total/20)} onClick={() => { setPage(p => p+1); load(status, search, page+1) }}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
