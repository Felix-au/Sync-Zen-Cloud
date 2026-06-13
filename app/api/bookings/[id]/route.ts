import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import { auth } from '@/lib/auth'
import { canCheckIn, isSuperAdmin } from '@/lib/roles'

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
    .lean() as any

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Rename roomIds -> rooms so the client doesn't need to know the internal field name
  const { roomIds, ...rest } = booking
  return NextResponse.json({ booking: { ...rest, rooms: roomIds ?? [] } })
}
