'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'

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
  checked_in: 'badge-green',
  checked_out: 'badge-muted',
  cancelled: 'badge-red',
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Checkout flow state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDateMismatchModal, setShowDateMismatchModal] = useState(false)
  const [showCheckoutOptionsModal, setShowCheckoutOptionsModal] = useState(false)
  const [checking, setChecking] = useState(false)
  const [servicePersonnel, setServicePersonnel] = useState('')

  async function load(s = status, q = search, p = page) {
    setLoading(true)
    const params = new URLSearchParams({ limit: '20', page: String(p) })
    if (s) params.set('status', s)
    if (q) params.set('search', q)
    const res = await fetch(`/api/bookings?${params}`)
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

  async function handleCheckoutTrigger(bookingItem: Booking) {
    console.log('handleCheckoutTrigger called for:', bookingItem)
    try {
      setSelectedBooking(bookingItem)
      
      // Check if scheduled check-out date is today (calendar dates comparison in IST)
      const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
      const bookingCheckoutLocal = new Date(bookingItem.checkOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

      console.log('todayLocal:', todayLocal, 'bookingCheckoutLocal:', bookingCheckoutLocal)

      if (todayLocal !== bookingCheckoutLocal) {
        console.log('Opening Date Mismatch warning modal')
        setShowDateMismatchModal(true)
      } else {
        console.log('Opening Checkout Status Options modal')
        setShowCheckoutOptionsModal(true)
      }
    } catch (err: any) {
      console.error('Error in handleCheckoutTrigger:', err)
      alert('Error triggering checkout flow: ' + (err?.message ?? err))
    }
  }

  async function handleUpdateCheckoutToToday() {
    if (!selectedBooking) return
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    setChecking(true)

    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOutDate: todayLocal })
      })
      const data = res.ok ? await res.json() : null

      if (res.ok && data?.booking) {
        setBookings(prev => prev.map(b => b._id === selectedBooking._id ? { ...b, checkOutDate: data.booking.checkOutDate, nights: data.booking.nights } : b))
        setShowDateMismatchModal(false)
        setShowCheckoutOptionsModal(true)
      } else {
        alert(data?.error ?? 'Failed to update checkout date to today.')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating checkout date.')
    } finally {
      setChecking(false)
    }
  }

  async function handleCheckoutConfirm(action: 'serviced' | 'maintenance', personnelName?: string) {
    if (!selectedBooking) return
    setChecking(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, servicePersonnel: personnelName })
      })
      if (res.ok) {
        setShowCheckoutOptionsModal(false)
        setServicePersonnel('')
        load() // reload bookings list
      } else {
        const data = await res.json()
        alert(data?.error ?? 'Checkout failed')
      }
    } catch (err) {
      console.error(err)
      alert('Checkout error')
    } finally {
      setChecking(false)
      setSelectedBooking(null)
    }
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
      <div className="bookings-filters flex gap-md flex-wrap mb-lg items-center">
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
        <div className="status-group flex gap-sm">
          {[['', 'All'], ['checked_in', 'Active'], ['checked_out', 'Checked Out']].map(([val, label]) => (
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

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}><span className="spinner spinner-lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">📋</span>
          <div className="empty-title">No bookings found</div>
          <div className="empty-text">No operational check-in records match the current criteria.</div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Primary Guest</th>
                  <th>Room(s)</th>
                  <th>Check-In Date</th>
                  <th>Check-Out Date</th>
                  <th>Nights</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const primary = b.guests.find(g => g.isPrimary) ?? b.guests[0]
                  const rooms = (b.roomIds as any[]).map(r => r.roomNumber ?? r).join(', ')
                  return (
                    <tr key={b._id} onClick={() => router.push(`/bookings/${b._id}`)}>
                      <td style={{ fontWeight: 600, color: 'var(--text-pri)' }}>{primary?.name}</td>
                      <td>{rooms}</td>
                      <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(b.checkInTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</td>
                      <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(b.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</td>
                      <td>{b.nights}</td>
                      <td><span className={`badge ${STATUS_CLASS[b.status] ?? 'badge-muted'}`}>{b.status.replace('_', ' ')}</span></td>
                      <td>
                        <div className="flex gap-xs">
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${b._id}`); }}>View</button>
                          {b.status === 'checked_in' && (
                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleCheckoutTrigger(b); }}>Check Out</button>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {b.bookingReference}
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
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => { setPage(p => p - 1); load(status, search, page - 1) }}>← Prev</button>
              <span style={{ padding: '6px 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-mute)' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => { setPage(p => p + 1); load(status, search, page + 1) }}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Date Mismatch Warning Modal */}
      <Modal
        open={showDateMismatchModal}
        onClose={() => setShowDateMismatchModal(false)}
        title="Check-Out Date Mismatch"
        footer={
          <>
            <button className="btn btn-ghost text-amber" onClick={() => { setShowDateMismatchModal(false); setShowCheckoutOptionsModal(true) }}>
              Ignore
            </button>
            <button className="btn btn-primary" onClick={handleUpdateCheckoutToToday} disabled={checking}>
              {checking ? <span className="spinner" /> : null}
              Update to Today &amp; Proceed
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 40, textAlign: 'center' }}>⚠️</div>
          <p style={{ fontSize: 'var(--fs-md)', color: 'var(--text-pri)', textAlign: 'center', fontWeight: 600 }}>
            Check-out date mismatch detected!
          </p>
          <div style={{ background: 'var(--elevated)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-mute)' }}>Scheduled Check-Out:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-pri)' }}>
                {selectedBooking ? new Date(selectedBooking.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }) : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-mute)' }}>Today&apos;s Date:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', textAlign: 'center' }}>
            It is recommended to align the check-out date to today so that guest stay nights are accurately calculated and logged in the system.
          </p>
        </div>
      </Modal>

      {/* Checkout Options Modal */}
      <Modal
        open={showCheckoutOptionsModal}
        onClose={() => setShowCheckoutOptionsModal(false)}
        title="Choose Check-Out Status"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCheckoutOptionsModal(false)}>Cancel</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 'var(--fs-md)', color: 'var(--text-pri)', textAlign: 'center' }}>
            Please select how the rooms should be marked upon check-out:
          </p>

          <div className="input-group" style={{ marginBottom: 4 }}>
            <label className="input-label" htmlFor="checkout-service-personnel" style={{ fontWeight: 600 }}>
              Service Personnel Name * <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>(Required for Check Out &amp; Service)</span>
            </label>
            <input
              id="checkout-service-personnel"
              type="text"
              className="input"
              placeholder="e.g. Ramesh Kumar"
              value={servicePersonnel}
              onChange={e => setServicePersonnel(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              onClick={() => {
                if (!servicePersonnel.trim()) {
                  alert('Please enter the name of the service personnel.')
                  return
                }
                if (!checking) handleCheckoutConfirm('serviced', servicePersonnel)
              }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-md)',
                cursor: checking ? 'not-allowed' : 'pointer',
                background: 'var(--elevated)',
                transition: 'border-color var(--t-fast)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 8
              }}
              onMouseEnter={e => { if (!checking) e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { if (!checking) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span style={{ fontSize: 28 }}>🧹</span>
              <div style={{ fontWeight: 700, color: 'var(--text-pri)' }}>Check Out &amp; Service</div>
              <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: 0 }}>
                Rooms are cleaned and marked <strong>Available</strong> for immediate check-in.
              </p>
            </div>

            <div
              onClick={() => { if (!checking) handleCheckoutConfirm('maintenance') }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-md)',
                cursor: checking ? 'not-allowed' : 'pointer',
                background: 'var(--elevated)',
                transition: 'border-color var(--t-fast)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 8
              }}
              onMouseEnter={e => { if (!checking) e.currentTarget.style.borderColor = 'var(--amber)' }}
              onMouseLeave={e => { if (!checking) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span style={{ fontSize: 28 }}>🔧</span>
              <div style={{ fontWeight: 700, color: 'var(--text-pri)' }}>Check Out Only</div>
              <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: 0 }}>
                Rooms are marked <strong>Under Maintenance</strong> for deep cleaning or repairs.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
