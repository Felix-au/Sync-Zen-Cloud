import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import Room from '@/lib/models/Room'
import '@/lib/models/User'   // ensure User schema is registered for .populate('createdBy')
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'
import { logActivity } from '@/lib/activityLogger'

/** Generates a booking reference like "SS1A2B3C" */
function genRef(): string {
  return 'SS' + Date.now().toString(36).toUpperCase().slice(-6)
}

/**
 * GET /api/bookings
 * Returns bookings for the current hotel, newest first.
 * Query params:
 *   status=checked_in|checked_out|cancelled
 *   search=<booking reference or guest name>
 *   limit=<number> (default 50)
 *   page=<number> (default 1)
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!session.user.hotelId) return NextResponse.json({ bookings: [], total: 0 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status')
  const search  = searchParams.get('search')
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const page    = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)
  const skip    = (page - 1) * limit

  const query: Record<string, any> = { hotelId: session.user.hotelId }
  if (status) query.status = status
  if (search) {
    query.$or = [
      { bookingReference: { $regex: search, $options: 'i' } },
      { 'guests.name': { $regex: search, $options: 'i' } },
    ]
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('roomIds', 'roomNumber roomType floor')
      .populate('createdBy', 'name')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ])

  return NextResponse.json({ bookings, total, page, limit })
}

/**
 * POST /api/bookings
 * Creates a new check-in booking.
 * Validates rooms are available, sets them to occupied, creates booking record.
 *
 * Body:
 * {
 *   guests: [{ name, phone?, age?, sex?, photoFileId?, photoUrl?, isPrimary }],
 *   roomIds: string[],
 *   checkOutDate: string (ISO date),
 *   nights: number,
 *   idProofFileId?: string,
 *   idProofUrl?: string,
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!session.user.hotelId) {
    return NextResponse.json({ error: 'Not associated with a hotel' }, { status: 400 })
  }

  try {
    const {
      guests,
      roomIds,
      checkOutDate,
      nights,
      idProofFileId,
      idProofUrl,
      idProofFileIds,
      idProofUrls,
      idProofNumber,
      notes,
      customChargePerNight,
      address,
      nationality,
      totalGuests,
      maleGuestsCount,
      femaleGuestsCount,
      childGuestsCount,
      purposeOfTravel,
      paymentMode,
    } = await req.json()

    // Validate required fields
    if (!guests?.length)  return NextResponse.json({ error: 'At least one guest is required' }, { status: 400 })
    if (!roomIds?.length) return NextResponse.json({ error: 'At least one room must be selected' }, { status: 400 })
    if (!checkOutDate)    return NextResponse.json({ error: 'checkOutDate is required' }, { status: 400 })
    if (!nights || nights < 1) return NextResponse.json({ error: 'nights must be >= 1' }, { status: 400 })

    // Validate guest breakdown sum
    const totalCount = Number(maleGuestsCount || 0) + Number(femaleGuestsCount || 0) + Number(childGuestsCount || 0)
    if (totalGuests && totalCount !== Number(totalGuests)) {
      return NextResponse.json({ error: 'Guest counts breakdown (Male + Female + Child) must equal Total Guests' }, { status: 400 })
    }

    await connectDB()

    // Verify all rooms belong to this hotel and are available
    const rooms = await Room.find({
      _id: { $in: roomIds },
      hotelId: session.user.hotelId,
    })

    if (rooms.length !== roomIds.length) {
      return NextResponse.json({ error: 'One or more rooms not found in this hotel' }, { status: 404 })
    }

    const unavailable = rooms.filter((r) => r.status !== 'available')
    if (unavailable.length > 0) {
      const nums = unavailable.map((r) => r.roomNumber).join(', ')
      return NextResponse.json({ error: `Room(s) not available: ${nums}` }, { status: 409 })
    }

    // Generate unique booking reference
    let bookingReference = genRef()
    while (await Booking.exists({ bookingReference })) { bookingReference = genRef() }

    // Create booking
    const booking = await Booking.create({
      hotelId: session.user.hotelId,
      bookingReference,
      checkOutDate: new Date(checkOutDate),
      nights,
      guests: guests.map((g: any, i: number) => ({
        name: g.name?.trim() || `Guest ${i + 1}`,
        phone: g.phone || undefined,
        age: g.age || undefined,
        sex: g.sex || undefined,
        photoFileId: g.photoFileId || undefined,
        photoUrl: g.photoUrl || undefined,
        isPrimary: i === 0,
      })),
      roomIds,
      idProofFileId: idProofFileId || undefined,
      idProofUrl: idProofUrl || undefined,
      idProofFileIds: idProofFileIds || [],
      idProofUrls: idProofUrls || [],
      idProofNumber: idProofNumber?.trim() || undefined,
      notes: notes?.trim() || undefined,
      status: 'checked_in',
      createdBy: session.user.id,
      customChargePerNight: customChargePerNight ? Number(customChargePerNight) : undefined,
      address: address?.trim() || undefined,
      nationality: nationality?.trim() || 'India',
      totalGuests: totalGuests ? Number(totalGuests) : 1,
      maleGuestsCount: maleGuestsCount ? Number(maleGuestsCount) : 0,
      femaleGuestsCount: femaleGuestsCount ? Number(femaleGuestsCount) : 0,
      childGuestsCount: childGuestsCount ? Number(childGuestsCount) : 0,
      purposeOfTravel: purposeOfTravel?.trim() || undefined,
      paymentMode: paymentMode || 'cash',
    })

    // Mark rooms as occupied
    await Room.updateMany(
      { _id: { $in: roomIds } },
      { status: 'occupied', updatedAt: new Date() }
    )

    // Log activity
    await logActivity(
      session.user.id,
      session.user.hotelId!,
      'booking_create',
      `Created booking ${bookingReference} for room(s): ${rooms.map(r => r.roomNumber).join(', ')} (Nights: ${nights}, Guests: ${totalGuests ?? 1})`
    )

    return NextResponse.json({ booking, bookingReference }, { status: 201 })
  } catch (err: any) {
    console.error('[bookings POST] Error:', err)
    return NextResponse.json({ error: 'Check-in failed', detail: err.message }, { status: 500 })
  }
}
