import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Room from '@/lib/models/Room'
import Booking from '@/lib/models/Booking'
import { auth } from '@/lib/auth'
import { canManageRooms } from '@/lib/roles'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/rooms/[id] — Edit room details or status (manager+) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageRooms(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const allowed = ['roomNumber', 'roomType', 'floor', 'pricePerNight', 'notes', 'status']
    const update: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }

    await connectDB()
    const { id } = await params

    const room = await Room.findOneAndUpdate(
      { _id: id, hotelId: session.user.hotelId },
      update,
      { new: true }
    )

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    return NextResponse.json({ room })
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Room number already exists in this hotel' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Update failed', detail: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/rooms/[id]
 * Deletes a room. Blocked if the room is currently occupied.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageRooms(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  await connectDB()
  const { id } = await params

  const room = await Room.findOne({ _id: id, hotelId: session.user.hotelId })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  if (room.status === 'occupied') {
    return NextResponse.json(
      { error: 'Cannot delete an occupied room — check out guests first' },
      { status: 409 }
    )
  }

  await Room.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Room deleted' })
}
