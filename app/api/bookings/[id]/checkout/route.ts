import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import Room from '@/lib/models/Room'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'

/**
 * POST /api/bookings/[id]/checkout
 *
 * Checks out a booking:
 * 1. Sets booking status → 'checked_out'
 * 2. Sets all associated rooms → 'available'
 *
 * Any staff member can perform a checkout (same as check-in privilege).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { id } = await params

  const booking = await Booking.findOne({
    _id: id,
    hotelId: session.user.hotelId,
    status: 'checked_in',
  })

  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found or is not currently checked in' },
      { status: 404 }
    )
  }

  // Free all rooms associated with this booking
  await Room.updateMany(
    { _id: { $in: booking.roomIds } },
    { status: 'available', updatedAt: new Date() }
  )

  // Mark booking as checked out
  booking.status = 'checked_out'
  await booking.save()

  return NextResponse.json({
    message: 'Checked out successfully',
    bookingReference: booking.bookingReference,
    roomsFreed: booking.roomIds.length,
  })
}
