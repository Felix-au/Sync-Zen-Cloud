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
  { id: 'guests', label: 'Guest Details' },
  { id: 'idproof', label: 'ID Proof' },
  { id: 'rooms', label: 'Select Room' },
  { id: 'confirm', label: 'Confirm' },
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

  // Stay profile additions
  const [address, setAddress] = useState('')
  const [nationalityType, setNationalityType] = useState('India')
  const [nationalityCustom, setNationalityCustom] = useState('')
  const [totalGuestsCount, setTotalGuestsCount] = useState('1')
  const [maleGuestsCount, setMaleGuestsCount] = useState('1')
  const [femaleGuestsCount, setFemaleGuestsCount] = useState('0')
  const [childGuestsCount, setChildGuestsCount] = useState('0')
  const [purposeOfTravel, setPurposeOfTravel] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')

  // Step 3 — ID proof
  const [idProofs, setIdProofs] = useState<Array<{ dataUri: string; filename: string }>>([])

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ ref: string } | null>(null)
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
  const isGuestCountValid = Number(maleGuestsCount || 0) + Number(femaleGuestsCount || 0) + Number(childGuestsCount || 0) === Number(totalGuestsCount || 0)
  const step1Valid = guests[0]?.name.trim() && checkOutDate && isGuestCountValid

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

      // Upload ID proofs if provided
      let idProofFileIds: string[] = []
      let idProofUrls: string[] = []
      if (idProofs.length > 0) {
        const results = await Promise.all(
          idProofs.map(async (proof, idx) => {
            const folder = `checkin/${Date.now()}_id_${idx}`
            const res = await uploadPhoto(proof.dataUri, proof.filename, folder)
            return res
          })
        )
        idProofFileIds = results.map(r => r.fileId)
        idProofUrls = results.map(r => r.url)
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
          idProofFileId: idProofFileIds[0] || undefined,
          idProofUrl: idProofUrls[0] || undefined,
          idProofFileIds,
          idProofUrls,
          notes: notes.trim() || undefined,
          customChargePerNight: customChargePerNight ? Number(customChargePerNight) : undefined,
          address: address.trim() || undefined,
          nationality: nationalityType === 'Other' ? nationalityCustom.trim() : nationalityType,
          totalGuests: Number(totalGuestsCount),
          maleGuestsCount: Number(maleGuestsCount),
          femaleGuestsCount: Number(femaleGuestsCount),
          childGuestsCount: Number(childGuestsCount),
          purposeOfTravel: purposeOfTravel || undefined,
          paymentMode,
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
            <button className="btn btn-primary" onClick={() => {
              setSuccess(null);
              setStep('guests');
              setSelectedRoomIds([]);
              setGuests([EMPTY_GUEST()]);
              setCheckOutDate('');
              setAddress('');
              setNationalityType('India');
              setNationalityCustom('');
              setTotalGuestsCount('1');
              setMaleGuestsCount('1');
              setFemaleGuestsCount('0');
              setChildGuestsCount('0');
              setPurposeOfTravel('');
              setPaymentMode('cash');
              setIdProofs([]);
            }}>
              ✚ New Check-In
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectedRooms = availableRooms.filter(r => selectedRoomIds.includes(r._id))
  const totalPrice = selectedRooms.reduce((sum, r) => sum + r.pricePerNight * nights, 0)

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
              {/* Stay & Guest Details */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-md)', color: 'var(--text-pri)' }}>Stay & Guest Details</h3>
                
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="checkout">Check-out Date *</label>
                    <input
                      id="checkout"
                      type="date"
                      className="input"
                      value={checkOutDate}
                      min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
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

                <div className="grid-2 mt-md" style={{ marginTop: 'var(--sp-md)' }}>
                  {/* Nationality */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="nationality">Nationality *</label>
                    <select
                      id="nationality"
                      className="input"
                      value={nationalityType}
                      onChange={e => setNationalityType(e.target.value)}
                    >
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Purpose of Travel */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="purpose">Purpose of Travel</label>
                    <select
                      id="purpose"
                      className="input"
                      value={purposeOfTravel}
                      onChange={e => setPurposeOfTravel(e.target.value)}
                    >
                      <option value="">Select option</option>
                      <option value="Leisure">Leisure</option>
                      <option value="Business">Business</option>
                      <option value="Personal">Personal</option>
                      <option value="Darshan">Darshan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Custom Nationality */}
                {nationalityType === 'Other' && (
                  <div className="input-group mt-md fade-in">
                    <label className="input-label" htmlFor="nationality-custom">Specify Country *</label>
                    <input
                      id="nationality-custom"
                      type="text"
                      className="input"
                      placeholder="Enter nationality / country"
                      value={nationalityCustom}
                      onChange={e => setNationalityCustom(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Address */}
                <div className="input-group mt-md">
                  <label className="input-label" htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    className="input"
                    rows={2}
                    placeholder="Enter guest's permanent address…"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--sp-md) 0' }} />

                {/* Guests breakdown */}
                <div className="input-group">
                  <label className="input-label" htmlFor="total-guests">Total Guests *</label>
                  <input
                    id="total-guests"
                    type="number"
                    min="1"
                    className="input"
                    value={totalGuestsCount}
                    onChange={e => setTotalGuestsCount(e.target.value)}
                  />
                </div>

                <div className="grid-3 mt-md guest-counts-grid" style={{ marginTop: 'var(--sp-md)' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="male-guests">Male</label>
                    <input
                      id="male-guests"
                      type="number"
                      min="0"
                      className="input"
                      value={maleGuestsCount}
                      onChange={e => setMaleGuestsCount(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="female-guests">Female</label>
                    <input
                      id="female-guests"
                      type="number"
                      min="0"
                      className="input"
                      value={femaleGuestsCount}
                      onChange={e => setFemaleGuestsCount(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="child-guests">Child</label>
                    <input
                      id="child-guests"
                      type="number"
                      min="0"
                      className="input"
                      value={childGuestsCount}
                      onChange={e => setChildGuestsCount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live validation warning */}
                {!isGuestCountValid && (
                  <div style={{ marginTop: 'var(--sp-md)', padding: 'var(--sp-sm) var(--sp-md)', background: 'var(--amber-dim)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--amber)', fontWeight: 600 }}>
                    ⚠️ Guest counts breakdown (Male: {maleGuestsCount} + Female: {femaleGuestsCount} + Child: {childGuestsCount} = {Number(maleGuestsCount || 0) + Number(femaleGuestsCount || 0) + Number(childGuestsCount || 0)}) must equal Total Guests ({totalGuestsCount}).
                  </div>
                )}
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
              <h1 className="page-title">ID Proof Documents</h1>
              <p className="page-subtitle">Upload group ID document(s) (passport, Aadhaar, driving licence). Front & back can be uploaded. Optional.</p>
            </div>
            <div className="glass-card" style={{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              
              {idProofs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--sp-md)' }}>
                  {idProofs.map((proof, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: 'var(--sp-sm)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src={proof.dataUri} alt={`ID Preview ${idx + 1}`} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ marginTop: 8, width: '100%' }}
                        onClick={() => setIdProofs(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <PhotoUpload
                label={idProofs.length > 0 ? "Add Another ID Document" : "Group ID Document"}
                onChange={(uri, name) => {
                  setIdProofs(prev => [...prev, { dataUri: uri, filename: name }])
                }}
              />
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

            {/* Payment details — shown once rooms are selected */}
            {selectedRoomIds.length > 0 && (
              <div className="glass-card" style={{ padding: 'var(--sp-lg)', marginTop: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                <div className="input-group">
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

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                <div className="input-group">
                  <label className="input-label">Mode of Payment</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {[
                      { value: 'cash', label: '💵 Cash' },
                      { value: 'online', label: '💳 Online' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`btn ${paymentMode === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, paddingBlock: 12 }}
                        onClick={() => setPaymentMode(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
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
              {/* Stay & Rooms summary */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--sp-md)' }}>Stay & Rooms</h3>
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
                <div style={{ marginTop: 8, fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>Payment Mode: <strong style={{ textTransform: 'capitalize' }}>{paymentMode}</strong></div>
                  {purposeOfTravel && <div>Purpose: <strong>{purposeOfTravel}</strong></div>}
                  <div>Nationality: <strong>{nationalityType === 'Other' ? nationalityCustom : nationalityType}</strong></div>
                </div>
              </div>

              {/* Guests summary */}
              <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                <div className="flex justify-between items-center mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                    Guests ({guests.length})
                  </h3>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-sec)', fontWeight: 600 }}>
                    Total: {totalGuestsCount} (M: {maleGuestsCount} · F: {femaleGuestsCount} · C: {childGuestsCount})
                  </div>
                </div>
                {address && (
                  <div style={{ marginBottom: 'var(--sp-md)', fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', background: 'var(--elevated)', padding: 'var(--sp-sm) var(--sp-md)', borderRadius: 'var(--r-md)' }}>
                    <strong>Address:</strong> {address}
                  </div>
                )}
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
              {idProofs && idProofs.length > 0 && (
                <div className="glass-card" style={{ padding: 'var(--sp-lg)' }}>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-mute)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--sp-md)' }}>ID Proof Document(s)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                    {idProofs.map((proof, idx) => (
                      <img key={idx} src={proof.dataUri} alt={`ID proof preview ${idx + 1}`} style={{ width: '100%', maxHeight: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ))}
                  </div>
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
                (step === 'rooms' && !step3Valid)
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
