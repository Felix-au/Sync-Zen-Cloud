'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'

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
  idProofNumber?: string
}

const STATUS_BADGE: Record<string, string> = {
  checked_in: 'badge-green',
  checked_out: 'badge-muted',
  cancelled: 'badge-red',
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  // Checkout date inline edit state
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [tempDate, setTempDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)

  // Checkout flow state
  const [showDateMismatchModal, setShowDateMismatchModal] = useState(false)
  const [showCheckoutOptionsModal, setShowCheckoutOptionsModal] = useState(false)

  // Custom modal and PDF states
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null)
  const [servicePersonnel, setServicePersonnel] = useState('')

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => { setBooking(d.booking ?? null); setLoading(false) })
  }, [id])

  async function triggerCheckoutFlow() {
    if (!booking) return

    // Check if scheduled check-out date is today (calendar dates comparison)
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
    const bookingCheckoutLocal = new Date(booking.checkOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

    if (todayLocal !== bookingCheckoutLocal) {
      setShowDateMismatchModal(true)
    } else {
      setShowCheckoutOptionsModal(true)
    }
  }

  async function handleUpdateCheckoutToToday() {
    if (!booking) return
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    setChecking(true)

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOutDate: todayLocal })
      })
      const data = res.ok ? await res.json() : null

      if (res.ok && data?.booking) {
        setBooking(data.booking)
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
    setChecking(true)
    try {
      const res = await fetch(`/api/bookings/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, servicePersonnel: personnelName })
      })
      if (res.ok) {
        setBooking(prev => prev ? { ...prev, status: 'checked_out' } : null)
        setShowCheckoutOptionsModal(false)
        setServicePersonnel('')
      } else {
        const data = await res.json()
        alert(data?.error ?? 'Checkout failed')
      }
    } catch (err) {
      console.error(err)
      alert('Checkout error')
    } finally {
      setChecking(false)
    }
  }

  async function handleSaveDate() {
    if (!tempDate) return
    setSavingDate(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOutDate: tempDate })
      })
      const data = res.ok ? await res.json() : null
      if (res.ok && data?.booking) {
        setBooking(data.booking)
        setIsEditingDate(false)
      } else {
        alert(data?.error ?? 'Failed to update check-out date.')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving check-out date.')
    } finally {
      setSavingDate(false)
    }
  }

  function handleDownloadPDF() {
    if (!booking) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Pop-up blocker is preventing PDF generation. Please allow pop-ups for this site.')
      return
    }

    const guestsListHtml = booking.guests.map((g, i) => `
      <div class="guest-card" style="display: flex; gap: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; background-color: #f9fafb;">
        ${g.photoUrl ? `<img src="${g.photoUrl}" alt="${g.name}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db;" />` : '<div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; font-size: 40px; background-color: #e5e7eb; border-radius: 6px; border: 1px solid #d1d5db; color: #9ca3af;">👤</div>'}
        <div style="flex: 1;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #111827; display: flex; align-items: center; gap: 8px;">
            ${g.name} ${g.isPrimary ? '<span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Primary Guest</span>' : ''}
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="font-size: 14px; color: #1f2937;"><strong style="color: #6b7280; font-weight: 600;">Phone:</strong> ${g.phone || '—'}</div>
            <div style="font-size: 14px; color: #1f2937;"><strong style="color: #6b7280; font-weight: 600;">Age:</strong> ${g.age || '—'}</div>
            <div style="font-size: 14px; color: #1f2937;"><strong style="color: #6b7280; font-weight: 600;">Sex:</strong> ${g.sex ? g.sex.charAt(0).toUpperCase() + g.sex.slice(1) : '—'}</div>
          </div>
        </div>
      </div>
    `).join('')

    const roomsListHtml = booking.rooms.map(r => `
      <div style="font-size: 14px; margin-bottom: 4px; font-weight: bold; color: #1f2937;">Room ${r.roomNumber} (${r.roomType} · Floor ${r.floor})</div>
    `).join('')

    const checkoutDateStr = new Date(booking.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })
    const checkinDateStr = new Date(booking.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' })

    const totalRoomsPrice = booking.rooms.reduce((s, r) => s + r.pricePerNight, 0)
    const chargePerNight = booking.customChargePerNight ?? totalRoomsPrice
    const totalAmount = chargePerNight * booking.nights

    const plotHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking_${booking.bookingReference}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
            .header-title h1 { margin: 0; font-size: 28px; color: #1e3a8a; font-weight: 800; }
            .header-title p { margin: 5px 0 0 0; color: #6b7280; font-size: 14px; }
            .ref-box { text-align: right; }
            .ref-title { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .ref-val { font-family: monospace; font-size: 24px; color: #3b82f6; font-weight: bold; margin-top: 2px; }
            
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .field { font-size: 14px; display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f3f4f6; }
            .label { color: #6b7280; font-weight: 600; }
            .val { font-weight: 700; color: #1f2937; }
            
            .notes-box { border-left: 4px solid #3b82f6; background-color: #eff6ff; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #1e3a8a; font-style: italic; }
            
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">
              <h1>SyncZen Cloud</h1>
              <p>Booking details & guest invoice</p>
            </div>
            <div class="ref-box">
              <div class="ref-title">Booking Reference</div>
              <div class="ref-val">${booking.bookingReference}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">General Details</div>
            <div class="grid">
              <div class="field"><span class="label">Check-in Time</span><span class="val">${checkinDateStr}</span></div>
              <div class="field"><span class="label">Check-out Date</span><span class="val">${checkoutDateStr}</span></div>
              <div class="field"><span class="label">Nights</span><span class="val">${booking.nights}</span></div>
              <div class="field"><span class="label">Payment Mode</span><span class="val">${booking.paymentMode?.toUpperCase()}</span></div>
              <div class="field"><span class="label">Charge per Night</span><span class="val">₹${chargePerNight.toLocaleString()}</span></div>
              <div class="field"><span class="label">Total Booking Amount</span><span class="val">₹${totalAmount.toLocaleString()}</span></div>
              <div class="field"><span class="label">Nationality</span><span class="val">${booking.nationality}</span></div>
              <div class="field"><span class="label">Purpose of Travel</span><span class="val">${booking.purposeOfTravel || '—'}</span></div>
              <div class="field"><span class="label">ID Document Number</span><span class="val">${booking.idProofNumber || '—'}</span></div>
              <div class="field"><span class="label">Status</span><span class="val" style="text-transform: uppercase;">${booking.status.replace('_', ' ')}</span></div>
            </div>
            <div style="margin-top: 15px;">
              <div style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">Rooms:</div>
              ${roomsListHtml}
            </div>
          </div>

          ${booking.notes ? `
            <div class="section">
              <div class="section-title">Staff Notes</div>
              <div class="notes-box">${booking.notes}</div>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Guests Details</div>
            ${guestsListHtml}
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(plotHTML)
    printWindow.document.close()
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
  const totalValue = chargePerNight * booking.nights
  const primary = booking.guests.find(g => g.isPrimary) ?? booking.guests[0]

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
            Checked in {new Date(booking.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleDownloadPDF}>
            📄 Save PDF
          </button>
          {booking.status === 'checked_in' && (
            <button className="btn btn-danger" onClick={triggerCheckoutFlow} disabled={checking}>
              {checking ? <span className="spinner" /> : '🔑'}
              {checking ? 'Processing…' : 'Check Out Now'}
            </button>
          )}
        </div>
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
                    padding: 'var(--sp-sm)',
                    borderRadius: 'var(--r-md)',
                    background: g.isPrimary ? 'var(--accent-dim)' : 'none',
                    border: g.isPrimary ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent',
                  }}
                >
                  {g.photoUrl ? (
                    <img
                      src={g.photoUrl}
                      alt={g.name}
                      className="guest-avatar"
                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setModalPhotoUrl(g.photoUrl || null)}
                    />
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
                        cursor: 'pointer',
                      }}
                      onClick={() => setModalPhotoUrl(url)}
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
                      cursor: 'pointer',
                    }}
                    onClick={() => setModalPhotoUrl(booking.idProofUrl || null)}
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
                ['Check-in', new Date(booking.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })],
                ['Check-out', (
                  isEditingDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="date"
                        className="input"
                        style={{ padding: '4px 8px', fontSize: 13, width: 140, height: 32, margin: 0 }}
                        value={tempDate}
                        min={new Date(booking.checkInTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                        onChange={e => setTempDate(e.target.value)}
                      />
                      <button className="btn btn-primary btn-sm" onClick={handleSaveDate} disabled={savingDate} style={{ padding: '4px 10px', height: 32 }}>
                        {savingDate ? '…' : 'Save'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingDate(false)} style={{ padding: '4px 10px', height: 32 }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</span>
                      {booking.status === 'checked_in' && (
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 4 }}
                          onClick={() => {
                            setTempDate(new Date(booking.checkOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
                            setIsEditingDate(true)
                          }}
                          className="btn-ghost"
                          title="Edit check-out date"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  )
                )],
                ['Nights', booking.nights],
                ['Charge / night', booking.customChargePerNight
                  ? `₹${booking.customChargePerNight.toLocaleString()} (custom)`
                  : booking.rooms.reduce((s, r) => s + r.pricePerNight, 0) > 0
                    ? `₹${booking.rooms.reduce((s, r) => s + r.pricePerNight, 0).toLocaleString()}`
                    : '—'],
                ['Checked in by', booking.createdBy?.name ?? '—'],
                ['Nationality', booking.nationality ?? 'India'],
                ['ID Document Number', booking.idProofNumber ?? '—'],
                ['Purpose of Travel', booking.purposeOfTravel ?? '—'],
                ['Payment Mode', booking.paymentMode ? booking.paymentMode.toUpperCase() : 'CASH'],
                ['Total Guests', booking.totalGuests ?? booking.guests.length],
                ['Guest Breakdown', `Male: ${booking.maleGuestsCount ?? 0} · Female: ${booking.femaleGuestsCount ?? 0} · Child: ${booking.childGuestsCount ?? 0}`],
                ['Address', booking.address ?? '—'],
                ...(booking.notes ? [['Notes', booking.notes]] : []),
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: 6, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)' }}>{label}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-pri)', display: 'flex', alignItems: 'center' }}>{value}</span>
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
                {booking ? new Date(booking.checkOutDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }) : ''}
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

      {/* Photo Preview Modal */}
      <Modal
        open={!!modalPhotoUrl}
        onClose={() => setModalPhotoUrl(null)}
        title="Image Preview"
        maxWidth={640}
      >
        {modalPhotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--elevated)', borderRadius: 'var(--r-md)', padding: 'var(--sp-md)' }}>
            <img
              src={modalPhotoUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--r-sm)' }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
