import { NextRequest, NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { connectDB } from '@/lib/mongodb'
import Hotel from '@/lib/models/Hotel'
import { auth } from '@/lib/auth'
import { canManageHotelSettings, canDeleteHotel, belongsToHotel, isSuperAdmin } from '@/lib/roles'

const genKey = () => {
  const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
  return `${alpha()}-${alpha()}`
}

type Params = { params: Promise<{ id: string }> }

/** GET /api/hotels/[id] — Get hotel details */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await params
  const hotel = await Hotel.findById(id).populate('ownerId', 'name email').lean()
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  if (!belongsToHotel(session.user.role as any, session.user.hotelId, id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ hotel })
}

/** PATCH /api/hotels/[id] — Update hotel info (owner+) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canManageHotelSettings(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — owner role required' }, { status: 403 })
  }
  const { id } = await params
  if (!belongsToHotel(session.user.role as any, session.user.hotelId, id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const allowed = ['name', 'address', 'phone', 'email', 'logoFileId', 'logoUrl']
    const update: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }

    await connectDB()
    const hotel = await Hotel.findByIdAndUpdate(id, update, { new: true })
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

    return NextResponse.json({ hotel })
  } catch (err: any) {
    return NextResponse.json({ error: 'Update failed', detail: err.message }, { status: 500 })
  }
}

/** DELETE /api/hotels/[id] — Delete hotel (owner only) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canDeleteHotel(session.user.role as any) && !isSuperAdmin(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — owner role required' }, { status: 403 })
  }

  await connectDB()
  const { id } = await params
  const hotel = await Hotel.findByIdAndDelete(id)
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  return NextResponse.json({ message: 'Hotel deleted' })
}
