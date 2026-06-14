'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Guest {
  name: string
  phone?: string
  age?: number
  sex?: string
  photoUrl?: string
  isPrimary: boolean
}

interface Room {
  _id: string
  roomNumber: string
  roomType: string
  floor?: number
  pricePerNight: number
}

interface Booking {
  _id: string
  bookingReference: string
  status: 'checked_in' | 'checked_out' | 'cancelled'
  guests: Guest[]
  rooms: Room[]
  checkInTime: string
  checkOutDate: string
  nights: number
  customChargePerNight?: number
  notes?: string
  idProofUrl?: string
  idProofFileIds?: string[]
  idProofUrls?: string[]
  createdBy: { name: string; email: string }
  hotelId: string
  address?: string
  nationality: string
  totalGuests: number
  maleGuestsCount: number
  femaleGuestsCount: number
  childGuestsCount: number
  purposeOfTravel?: string
  paymentMode: string
}

const STATUS_BADGE: Record<string, string> = {
  checked_in:   'badge-green',
  checked_out:  'badge-muted',
  cancelled:    'badge-red',
}

export default function BookingDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const router     = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => { setBooking(d.booking ?? null); setLoading(false) })
  }, [id])

  async function handleCheckout() {
    if (!confirm('Confirm check-out for this booking?')) return
    setChecking(true)
    const res = await fetch(`/api/bookings/${id}/checkout`, { method: 'POST' })
    setChecking(false)
    if (res.ok) {
      setBooking(prev => prev ? { ...prev, status: 'checked_out' } : null)
    }
  }

  if (loading) return (
    <div className="page-container flex justify-center" style={{ paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  if (!booking) return (
    <div className="page-container">
      <div className="glass-card empty-state">
        <span className="empty-icon">🔍</span>
        <div className="empty-title">Booking not found</div>
        <div className="empty-text">This booking may have been removed or you don&apos;t have access.</div>
        <button className="btn btn-ghost" onClick={() => router.push('/bookings')}>← Back to Bookings</button>
      </div>
    </div>
  )

  const chargePerNight = booking.customChargePerNight
    ?? booking.rooms.reduce((sum, r) => sum + r.pricePerNight, 0)
  const totalValue  = chargePerNight * booking.nights
  const primary     = booking.guests.find(g => g.isPrimary) ?? booking.guests[0]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <button
            className="btn btn-ghost btn-sm mb-sm"
            style={{ marginBottom: 8 }}
            onClick={() => router.push('/bookings')}
          >
            ← Bookings
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
              {booking.bookingReference}
            </span>
            <span className={`badge ${STATUS_BADGE[booking.status]}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </h1>
          <p className="page-subtitle">
            Checked in {new Date(booking.checkInTime).toLocaleString()}
          </p>
        </div>
        {booking.status === 'checked_in' && (
          <button className="btn btn-danger" onClick={handleCheckout} disabled={checking}>
            {checking ? <span className="spinner" /> : '🔑'}
            {checking ? 'Processing…' : 'Check Out Now'}
          </button>
        )}
      </div>

      <div className="grid-2 gap-lg" style={{ gap: 'var(--sp-lg)' }}>
        {/* Left column */}
        <div className="flex-col gap-lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>

          {/* Guests */}
          <div className="glass-card">
            <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>
                Guests ({booking.guests.length})
              </h2>
            </div>
            <div style={{ padding: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              {booking.guests.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-md)',
                    padding: 'var(--sp-sm) var(--sp-md)',
                    background: g.isPrimary ? 'var(--accent-dim)' : 'var(--glass-bg)',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${g.isPrimary ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                  }}
                >
                  {g.photoUrl ? (
                    <img src={g.photoUrl} alt={g.name} className="guest-avatar" />
                  ) : (
                    <div
                      className="guest-avatar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        background: 'var(--elevated)',
                      }}
                    >
                      👤
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-pri)', fontSize: 'var(--fs-sm)' }}>
                      {g.name}
                      {g.isPrimary && (
                        <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: 10 }}>Primary</span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 2 }}>
                      {[g.phone, g.age ? `Age ${g.age}` : null, g.sex].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ID Proof */}
          {((booking.idProofUrls && booking.idProofUrls.length > 0) || booking.idProofUrl) && (
            <div className="glass-card">
              <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>ID Proof Document(s)</h2>
              </div>
              <div style={{ padding: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {booking.idProofUrls && booking.idProofUrls.length > 0 ? (
                  booking.idProofUrls.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`ID proof ${idx + 1}`}
                      style={{
                        width: '100%',
                        borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)',
                        maxHeight: 280,
                        objectFit: 'contain',
                        background: 'var(--elevated)',
                      }}
                    />
                  ))
                ) : (
                  <img
                    src={booking.idProofUrl}
                    alt="ID proof"
                    style={{
                      width: '100%',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      maxHeight: 280,
                      objectFit: 'contain',
                      background: 'var(--elevated)',
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex-col gap-lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>

          {/* Stay summary */}
          <div className="glass-card">
            <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>Stay Details</h2>
            </div>
            <div style={{ padding: 'var(--sp-md) var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              {[
                ['Check-in',      new Date(booking.checkInTime).toLocaleString()],
                ['Check-out',     new Date(booking.checkOutDate).toLocaleDateString()],
                ['Nights',        booking.nights],
                ['Charge / night', booking.customChargePerNight
                  ? `₹${booking.customChargePerNight.toLocaleString()} (custom)`
                  : booking.rooms.reduce((s, r) => s + r.pricePerNight, 0) > 0
                    ? `₹${booking.rooms.reduce((s, r) => s + r.pricePerNight, 0).toLocaleString()}`
                    : '—'],
                ['Checked in by',  booking.createdBy?.name ?? '—'],
                ['Nationality',    booking.nationality ?? 'India'],
                ['Purpose of Travel', booking.purposeOfTravel ?? '—'],
                ['Payment Mode',   booking.paymentMode ? booking.paymentMode.toUpperCase() : 'CASH'],
                ['Total Guests',   booking.totalGuests ?? booking.guests.length],
                ['Guest Breakdown', `Male: ${booking.maleGuestsCount ?? 0} · Female: ${booking.femaleGuestsCount ?? 0} · Child: ${booking.childGuestsCount ?? 0}`],
                ['Address',        booking.address ?? '—'],
                ...(booking.notes ? [['Notes', booking.notes]] : []),
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: 6, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)' }}>{label}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-pri)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms */}
          <div className="glass-card">
            <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>
                Rooms ({booking.rooms.length})
              </h2>
            </div>
            <div style={{ padding: 'var(--sp-sm)' }}>
              {booking.rooms.map((room) => (
                <div
                  key={room._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--sp-sm) var(--sp-md)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-pri)' }}>Room {room.roomNumber}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>
                      {room.roomType}{room.floor != null ? ` · Floor ${room.floor}` : ''}
                    </div>
                  </div>
                  {/* Only show room-level rate when no custom charge is set */}
                  {!booking.customChargePerNight && room.pricePerNight > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        ₹{room.pricePerNight.toLocaleString()}/night
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>
                        ₹{(room.pricePerNight * booking.nights).toLocaleString()} total
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              margin: 'var(--sp-sm)',
              padding: 'var(--sp-md)',
              background: 'var(--accent-dim)',
              borderRadius: 'var(--r-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <div>
                <span style={{ fontWeight: 800, color: 'var(--text-pri)' }}>
                  Grand Total ({booking.nights} night{booking.nights !== 1 ? 's' : ''})
                </span>
                {booking.customChargePerNight && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--amber)', marginTop: 2 }}>custom rate applied</div>
                )}
              </div>
              <span style={{ fontWeight: 900, fontSize: 'var(--fs-xl)', color: 'var(--accent)' }}>
                ₹{totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
