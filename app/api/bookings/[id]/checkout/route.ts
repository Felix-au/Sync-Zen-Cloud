import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import Room from '@/lib/models/Room'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'
import { logActivity } from '@/lib/activityLogger'

/**
 * POST /api/bookings/[id]/checkout
 *
 * Checks out a booking:
 * 1. Sets booking status → 'checked_out'
 * 2. Sets all associated rooms → 'available' (serviced) or 'maintenance'
 *
 * Any staff member can perform a checkout (same as check-in privilege).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { id } = await params

  const booking = await Booking.findOne({
    _id: id,
    hotelId: session.user.hotelId,
    status: 'checked_in',
  }).populate('roomIds', 'roomNumber')

  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found or is not currently checked in' },
      { status: 404 }
    )
  }

  let action = 'serviced'
  let servicePersonnel = ''
  try {
    const body = await req.json()
    if (body.action === 'maintenance') {
      action = 'maintenance'
    } else {
      servicePersonnel = body.servicePersonnel || ''
    }
  } catch (e) {
    // default to serviced
  }

  if (action === 'serviced' && !servicePersonnel.trim()) {
    return NextResponse.json({ error: 'Service personnel name is required for Check Out & Service' }, { status: 400 })
  }

  const roomIdsList = booking.roomIds.map((r: any) => r._id || r)
  const roomStatus = action === 'maintenance' ? 'maintenance' : 'available'

  // Free or maintain rooms associated with this booking
  await Room.updateMany(
    { _id: { $in: roomIdsList } },
    { status: roomStatus, updatedAt: new Date() }
  )

  // Mark booking as checked out
  booking.status = 'checked_out'
  await booking.save()

  // Log checkout activity
  const roomNumbers = (booking.roomIds as any[]).map((r: any) => r.roomNumber || r).join(', ')
  await logActivity(
    session.user.id,
    session.user.hotelId!,
    'booking_checkout',
    `Checked out booking ${booking.bookingReference} for room(s): ${roomNumbers}. Rooms marked as ${action === 'maintenance' ? 'Under Maintenance' : `Available (Serviced by ${servicePersonnel.trim()})`}.`
  )

  return NextResponse.json({
    message: 'Checked out successfully',
    bookingReference: booking.bookingReference,
    roomsFreed: booking.roomIds.length,
    roomStatus,
  })
}
