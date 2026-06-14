import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import '@/lib/models/User'   // register User schema for .populate('createdBy')
import '@/lib/models/Hotel'  // register Hotel schema for .populate('hotelId')
import '@/lib/models/Room'   // register Room schema for .populate('roomIds')
import { auth } from '@/lib/auth'
import { canCheckIn, isSuperAdmin } from '@/lib/roles'
import { logActivity } from '@/lib/activityLogger'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/bookings/[id]
 * Full booking detail including populated rooms and creator.
 * super_admin can access any booking regardless of hotel.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { id } = await params

  const filter: Record<string, unknown> = { _id: id }
  // Scope to hotel unless super_admin
  if (!isSuperAdmin(session.user.role as any)) {
    filter.hotelId = session.user.hotelId
  }

  const booking = await Booking.findOne(filter)
    .populate('roomIds', 'roomNumber roomType floor pricePerNight')
    .populate('createdBy', 'name email')
    .populate('hotelId', 'name')
    .lean() as any

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Rename roomIds -> rooms so the client doesn't need to know the internal field name
  const { roomIds, ...rest } = booking
  return NextResponse.json({ booking: { ...rest, rooms: roomIds ?? [] } })
}

/**
 * PATCH /api/bookings/[id]
 * Updates booking details (currently checkOutDate).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { checkOutDate } = await req.json()
    if (!checkOutDate) {
      return NextResponse.json({ error: 'checkOutDate is required' }, { status: 400 })
    }

    await connectDB()
    const { id } = await params

    const filter: Record<string, unknown> = { _id: id }
    if (!isSuperAdmin(session.user.role as any)) {
      filter.hotelId = session.user.hotelId
    }

    const booking = await Booking.findOne(filter)
      .populate('roomIds', 'roomNumber roomType floor pricePerNight')
      .populate('hotelId', 'name')

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'checked_in') {
      return NextResponse.json({ error: 'Cannot update check-out date for completed or cancelled bookings' }, { status: 400 })
    }

    // Validate checkout date is not before check-in date
    const checkIn = new Date(booking.checkInTime)
    const checkOut = new Date(checkOutDate)
    if (isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: 'Invalid checkOutDate' }, { status: 400 })
    }

    const checkInDateOnly = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate())
    const checkOutDateOnly = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate())

    if (checkOutDateOnly < checkInDateOnly) {
      return NextResponse.json({ error: 'Check-out date cannot be before check-in date' }, { status: 400 })
    }

    // Calculate nights
    const diffTime = checkOutDateOnly.getTime() - checkInDateOnly.getTime()
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    const oldCheckOutDate = booking.checkOutDate
    booking.checkOutDate = checkOut
    booking.nights = nights
    await booking.save()

    // Activity Log
    await logActivity(
      session.user.id,
      session.user.hotelId!,
      'booking_checkout_date_update',
      `Updated check-out date for booking ${booking.bookingReference} from ${new Date(oldCheckOutDate).toLocaleDateString()} to ${new Date(checkOut).toLocaleDateString()} (Nights: ${nights}).`
    )

    // Rename roomIds -> rooms
    const jsonBooking = booking.toJSON() as any
    const { roomIds, ...rest } = jsonBooking
    return NextResponse.json({ booking: { ...rest, rooms: roomIds ?? [] } })
  } catch (err: any) {
    console.error('[booking PATCH] error:', err?.message ?? err)
    return NextResponse.json({ error: 'Update failed', detail: err.message }, { status: 500 })
  }
}
