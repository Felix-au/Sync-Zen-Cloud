import { NextRequest, NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { connectDB } from '@/lib/mongodb'
import Hotel from '@/lib/models/Hotel'
import { auth } from '@/lib/auth'
import { canManageHotelSettings, belongsToHotel } from '@/lib/roles'

const genKey = () => {
  const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
  return `${alpha()}-${alpha()}`
}

/**
 * POST /api/hotels/[id]/invite-key
 *
 * Regenerates the hotel's invite key. Old key immediately becomes invalid.
 * Useful if the key has been shared too broadly.
 * Requires hotel_owner or higher.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canManageHotelSettings(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — owner role required' }, { status: 403 })
  }

  if (!belongsToHotel(session.user.role as any, session.user.hotelId, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  // Generate a key guaranteed to be unique
  let inviteKey = genKey()
  while (await Hotel.exists({ inviteKey })) { inviteKey = genKey() }

  const hotel = await Hotel.findByIdAndUpdate(params.id, { inviteKey }, { new: true })
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  return NextResponse.json({ inviteKey: hotel.inviteKey })
}
