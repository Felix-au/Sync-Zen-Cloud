'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepWizard } from '@/components/StepWizard'
import { PhotoUpload } from '@/components/PhotoUpload'

/* ── Types ───────────────────────────────────────────────────── */
interface Room { _id: string; roomNumber: string; roomType: string; floor: number; pricePerNight: number }
interface Guest {
  name: string; phone: string; age: string; sex: string
  photoDataUri?: string; photoFilename?: string; photoUrl?: string; photoFileId?: string
}

/* ── Wizard Steps ────────────────────────────────────────────── */
const STEPS = [
  { id: 'guests',   label: 'Guest Details' },
  { id: 'idproof',  label: 'ID Proof' },
  { id: 'rooms',    label: 'Select Room' },
  { id: 'confirm',  label: 'Confirm' },
]

const EMPTY_GUEST = (): Guest => ({ name: '', phone: '', age: '', sex: '', photoDataUri: undefined, photoFilename: undefined })

export default function CheckInPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState('guests')

  // Step 1 — Room selection
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [customChargePerNight, setCustomChargePerNight] = useState('')

  // Step 2 — Guests
  const [guests, setGuests] = useState<Guest[]>([EMPTY_GUEST()])
  const [checkOutDate, setCheckOutDate] = useState('')
  const [nights, setNights] = useState(1)
  const [notes, setNotes] = useState('')

  // Step 3 — ID proof
  const [idProofDataUri, setIdProofDataUri]     = useState<string | undefined>()
  const [idProofFilename, setIdProofFilename]   = useState<string | undefined>()

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState<{ ref: string } | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Load available rooms on mount
  useEffect(() => {
    fetch('/api/rooms?status=available')
      .then(r => r.json())
      .then(d => { setAvailableRooms(d.rooms ?? []); setLoadingRooms(false) })
  }, [])

  // Auto-calculate nights from checkout date
  useEffect(() => {
    if (!checkOutDate) return
    const diff = Math.ceil((new Date(checkOutDate).getTime() - Date.now()) / 86_400_000)
    setNights(Math.max(1, diff))
  }, [checkOutDate])

  /* ── Helper: upload photo ────────────────────────────────────── */
  async function uploadPhoto(dataUri: string, filename: string, folder: string) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUri, filename, folder }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed')
    return res.json() as Promise<{ fileId: string; url: string }>
  }

  /* ── Step navigation ─────────────────────────────────────────── */
  function goPrev() {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx > 0) setStep(STEPS[idx - 1].id)
  }

  function goNext() {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
  }

  /* ── Guest helpers ────────────────────────────────────────────── */
  function updateGuest(idx: number, field: keyof Guest, value: string) {
    setGuests(gs => gs.map((g, i) => i === idx ? { ...g, [field]: value } : g))
  }

  function setGuestPhoto(idx: number, dataUri: string, filename: string) {
    setGuests(gs => gs.map((g, i) => i === idx ? { ...g, photoDataUri: dataUri, photoFilename: filename } : g))
  }

  function addGuest() { setGuests(gs => [...gs, EMPTY_GUEST()]) }
  function removeGuest(idx: number) { if (guests.length > 1) setGuests(gs => gs.filter((_, i) => i !== idx)) }

  /* ── Validate step 2 (rooms) ─────────────────────────────────── */
  const step3Valid = selectedRoomIds.length > 0

  /* ── Validate step 1 (guests) ────────────────────────────────── */
  const step1Valid = guests[0]?.name.trim() && checkOutDate

  /* ── Submit check-in ─────────────────────────────────────────── */
  async function handleSubmit() {
    setError('')
    setSubmitting(true)

    try {
      // Upload guest photos in parallel
      const uploadedGuests = await Promise.all(guests.map(async (g, i) => {
        if (g.photoDataUri && g.photoFilename) {
          const folder = `checkin/${Date.now()}`
          const { fileId, url } = await uploadPhoto(g.photoDataUri, g.photoFilename, folder)
          return { ...g, photoFileId: fileId, photoUrl: url }
        }
        return g
      }))

      // Upload ID proof if provided
      let idProofFileId: string | undefined
      let idProofUrl: string | undefined
      if (idProofDataUri && idProofFilename) {
        const folder = `checkin/${Date.now()}`
        const res = await uploadPhoto(idProofDataUri, idProofFilename, folder)
        idProofFileId = res.fileId
        idProofUrl = res.url
      }

      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guests: uploadedGuests.map((g, i) => ({
            name: g.name.trim(),
            phone: g.phone || undefined,
            age: g.age ? Number(g.age) : undefined,
            sex: g.sex || undefined,
            photoFileId: g.photoFileId,
            photoUrl: g.photoUrl,
            isPrimary: i === 0,
          })),
          roomIds: selectedRoomIds,
          checkOutDate,
          nights,
          idProofFileId,
          idProofUrl,
          notes: notes.trim() || undefined,
          customChargePerNight: customChargePerNight ? Number(customChargePerNight) : undefined,
        }),
      })

      const bookingData = await bookingRes.json()
      if (!bookingRes.ok) { setError(bookingData.error ?? 'Check-in failed'); setSubmitting(false); return }

      setSuccess({ ref: bookingData.bookingReference })
    } catch (err: any) {
      setError(err.message ?? 'Unexpected error')
      setSubmitting(false)
    }
  }

  /* ── Success screen ───────────────────────────────────────────── */
  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-card" style={{ padding: 'var(--sp-2xl)', textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 64, marginBottom: 'var(--sp-md)' }}>✅</div>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Check-in complete!</h1>
          <p style={{ color: 'var(--text-mute)', margin: 'var(--sp-md) 0' }}>Booking reference:</p>
          <div className="invite-key" style={{ justifyContent: 'center', marginBottom: 'var(--sp-xl)' }}>
            {success.ref}
          </div>
          <div className="flex gap-md justify-center">
            <button className="btn btn-ghost" onClick={() => router.push('/bookings')}>View Bookings</button>
            <button className="btn btn-primary" onClick={() => { setSuccess(null); setStep('guests'); setSelectedRoomIds([]); setGuests([EMPTY_GUEST()]); setCheckOutDate(''); }}>
              ✚ New Check-In
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectedRooms = availableRooms.filter(r => selectedRoomIds.includes(r._id))
  const totalPrice    = selectedRooms.reduce((sum, r) => sum + r.pricePerNight * nights, 0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Step bar */}
      <StepWizard steps={STEPS} currentStep={step} />

      <div className="checkin-content" style={{ flex: 1, padding: 'var(--sp-xl) var(--sp-2xl)', maxWidth: 800, margin: '0 auto', width: '100%' }}>

        {/* ── Step 1: Guest Details ─────────────────────────────────── */}
        {step === 'guests' && (
          <div className="fade-in">
            <div className="page-header flex justify-between items-center flex-wrap gap-md">
              <div>
                <h1 className="page-title">Guest Details</h1>
                <p className="page-subtitle">Add all guests checking into room(s) {selectedRooms.map(r => r.roomNumber).join(', ')}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={addGuest}>+ Add Guest</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
              {/* Stay details */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-md)', color: 'var(--text-pri)' }}>Stay Details</h3>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="checkout">Check-out Date *</label>
                    <input
                      id="checkout"
                      type="date"
                      className="input"
                      value={checkOutDate}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      onChange={e => setCheckOutDate(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nights</label>
                    <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-pri)' }}>
                      {nights} night{nights !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="input-group mt-md">
                  <label className="input-label" htmlFor="notes">Notes (optional)</label>
                  <textarea id="notes" className="input" rows={2} placeholder="Special requests, notes…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              {/* Guest cards */}
              {guests.map((guest, idx) => (
                <div key={idx} className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                  <div className="flex justify-between items-center mb-md">
                    <h3 style={{ fontWeight: 700, color: 'var(--text-pri)' }}>
                      {idx === 0 ? '★ Primary Guest' : `Guest ${idx + 1}`}
                    </h3>
                    {idx > 0 && <button className="btn btn-danger btn-sm" onClick={() => removeGuest(idx)}>Remove</button>}
                  </div>

                  <div className="guest-grid" style={{
                    display: 'grid',
                    gridTemplateAreas: `
                      "photo name"
                      "photo phone"
                      "age   sex"
                    `,
                    gridTemplateColumns: '120px 1fr',
                    gridTemplateRows: 'auto auto auto',
                    gap: 'var(--sp-md)',
                    alignItems: 'start',
                  }}>
                    {/* Photo — spans rows 1 & 2, centred vertically */}
                    <div style={{ gridArea: 'photo', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                      <PhotoUpload
                        compact
                        previewUrl={guest.photoDataUri}
                        onChange={(uri, name) => setGuestPhoto(idx, uri, name)}
                      />
                    </div>

                    {/* Name — row 1, col 2 */}
                    <div className="input-group" style={{ gridArea: 'name' }}>
                      <label className="input-label">Full Name *</label>
                      <input className="input" placeholder="Full name" value={guest.name} onChange={e => updateGuest(idx, 'name', e.target.value)} required />
                    </div>

                    {/* Phone — row 2, col 2 */}
                    <div className="input-group" style={{ gridArea: 'phone' }}>
                      <label className="input-label">Phone</label>
                      <input className="input" placeholder="+91 98765 43210" value={guest.phone} onChange={e => updateGuest(idx, 'phone', e.target.value)} />
                    </div>

                    {/* Age — row 3, col 1 */}
                    <div className="input-group" style={{ gridArea: 'age' }}>
                      <label className="input-label">Age</label>
                      <input className="input" type="number" min="1" max="120" placeholder="Age" value={guest.age} onChange={e => updateGuest(idx, 'age', e.target.value)} />
                    </div>

                    {/* Sex — row 3, col 2 */}
                    <div className="input-group" style={{ gridArea: 'sex' }}>
                      <label className="input-label">Sex</label>
                      <select className="input" value={guest.sex} onChange={e => updateGuest(idx, 'sex', e.target.value)}>
                        <option value="">Not specified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                </div>
              ))}

              <button className="btn btn-ghost" onClick={addGuest} style={{ alignSelf: 'flex-start' }}>
                + Add Another Guest
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: ID Proof ─────────────────────────────────────── */}
        {step === 'idproof' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">ID Proof</h1>
              <p className="page-subtitle">Upload a group ID document (passport, Aadhaar, driving licence). Optional.</p>
            </div>
            <div className="glass-card" style={{ padding: 'var(--sp-xl)' }}>
              <PhotoUpload
                label="Group ID Document"
                previewUrl={idProofDataUri}
                onChange={(uri, name) => { setIdProofDataUri(uri); setIdProofFilename(name) }}
              />
              {idProofDataUri && (
                <button className="btn btn-ghost btn-sm mt-md" onClick={() => { setIdProofDataUri(undefined); setIdProofFilename(undefined) }}>
                  ✕ Remove
                </button>
              )}
            </div>
          </div>
        )}
        {/* ── Step 3: Select Room ───────────────────────────────────── */}
        {step === 'rooms' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Select Room(s)</h1>
              <p className="page-subtitle">Choose one or more available rooms for this check-in</p>
            </div>

            {loadingRooms ? <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}><span className="spinner spinner-lg" /></div>
            : availableRooms.length === 0 ? (
              <div className="glass-card empty-state">
                <span className="empty-icon">🏠</span>
                <div className="empty-title">No rooms available</div>
                <div className="empty-text">All rooms are currently occupied or under maintenance.</div>
              </div>
            ) : (
              <div className="room-grid">
                {availableRooms.map(room => (
                  <div
                    key={room._id}
                    className={`glass-card room-card ${selectedRoomIds.includes(room._id) ? 'selected' : ''}`}
                    onClick={() => setSelectedRoomIds(ids =>
                      ids.includes(room._id) ? ids.filter(id => id !== room._id) : [...ids, room._id]
                    )}
                  >
                    <div className="room-number">{room.roomNumber}</div>
                    <div className="room-type">Floor {room.floor} · {room.roomType}</div>
                    {room.pricePerNight > 0 && <div className="room-price">₹{room.pricePerNight.toLocaleString()}/night</div>}
                    {selectedRoomIds.includes(room._id) && (
                      <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--accent)', fontSize: 20 }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Custom charge — shown once rooms are selected */}
            {selectedRoomIds.length > 0 && (
              <div className="glass-card" style={{ padding: 'var(--sp-lg)', marginTop: 'var(--sp-md)' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="custom-charge">
                    Charge per night
                    <span style={{ fontWeight: 400, color: 'var(--text-mute)', marginLeft: 6 }}>(optional — overrides room rate)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--fs-md)', color: 'var(--text-sec)', flexShrink: 0 }}>₹</span>
                    <input
                      id="custom-charge"
                      className="input"
                      type="number"
                      min="0"
                      step="50"
                      placeholder={selectedRooms.reduce((s, r) => s + (r.pricePerNight ?? 0), 0) > 0
                        ? selectedRooms.reduce((s, r) => s + (r.pricePerNight ?? 0), 0).toString()
                        : 'Enter amount'}
                      value={customChargePerNight}
                      onChange={e => setCustomChargePerNight(e.target.value)}
                    />
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', flexShrink: 0 }}>/night</span>
                    {customChargePerNight && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCustomChargePerNight('')}
                        title="Reset to room rate"
                        style={{ flexShrink: 0 }}
                      >✕</button>
                    )}
                  </div>
                  {customChargePerNight && nights > 0 && (
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginTop: 4, display: 'block' }}>
                      Total: ₹{(Number(customChargePerNight) * nights).toLocaleString()} for {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Confirm ──────────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Confirm Check-In</h1>
              <p className="page-subtitle">Review all details before completing the check-in</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
              {/* Rooms summary */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--sp-md)' }}>Rooms</h3>
                <div className="flex gap-sm flex-wrap">
                  {selectedRooms.map(r => (
                    <div key={r._id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, color: 'var(--text-pri)' }}>{r.roomNumber}</span>
                      <span style={{ color: 'var(--text-mute)', fontSize: 'var(--fs-xs)' }}>{r.roomType}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--sp-md)', fontSize: 'var(--fs-sm)', color: 'var(--text-sec)' }}>
                  Check-out: <strong>{checkOutDate}</strong> · {nights} night{nights !== 1 ? 's' : ''}
                  {(() => {
                    const chargePerNight = customChargePerNight
                      ? Number(customChargePerNight)
                      : totalPrice / nights
                    const totalCharge = chargePerNight * nights
                    return totalCharge > 0 ? (
                      <>
                        {' '}·{' '}
                        {customChargePerNight && (
                          <span style={{ color: 'var(--amber)', fontSize: 'var(--fs-xs)' }}>custom rate </span>
                        )}
                        ₹{chargePerNight.toLocaleString()}/night · Total: <strong style={{ color: 'var(--accent)' }}>₹{totalCharge.toLocaleString()}</strong>
                      </>
                    ) : null
                  })()}
                </div>
              </div>

              {/* Guests summary */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--sp-md)' }}>
                  Guests ({guests.length})
                </h3>
                {guests.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'center', padding: 'var(--sp-sm) 0', borderBottom: i < guests.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {g.photoDataUri
                      ? <img src={g.photoDataUri} alt={g.name} className="guest-avatar" />
                      : <div className="guest-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-pri)' }}>
                        {g.name || <em style={{ color: 'var(--text-mute)' }}>Unnamed</em>}
                        {i === 0 && <span className="badge badge-blue" style={{ marginLeft: 8 }}>Primary</span>}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>
                        {[g.age && `Age ${g.age}`, g.sex, g.phone].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ID proof */}
              {idProofDataUri && (
                <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--sp-md)' }}>ID Proof</h3>
                  <img src={idProofDataUri} alt="ID proof" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
                </div>
              )}

              {error && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: 'var(--red)', fontSize: 'var(--fs-sm)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation buttons ────────────────────────────────────── */}
        <div className="checkin-nav flex justify-between mt-xl">
          <button className="btn btn-ghost" onClick={goPrev} disabled={step === 'rooms' || submitting}>
            ← Back
          </button>

          {step !== 'confirm' ? (
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={
                (step === 'guests' && !step1Valid) ||
                (step === 'rooms'  && !step3Valid)
              }
            >
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner" /> Checking in…</> : '✓ Complete Check-In'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
