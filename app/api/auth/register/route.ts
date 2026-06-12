import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Hotel from '@/lib/models/Hotel'
import { auth } from '@/lib/auth'

/**
 * POST /api/auth/register
 *
 * Registers a new user account. Does NOT auto-assign to a hotel —
 * the caller must then either:
 *   POST /api/hotels      → create a new hotel (becomes hotel_owner)
 *   POST /api/hotels/join → join via invite key (becomes staff)
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'staff',   // default — elevated after hotel creation/join
      hotelId: null,
    })

    return NextResponse.json(
      { id: user._id.toString(), email: user.email, name: user.name },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[register] Error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

/**
 * POST /api/auth/join
 *
 * Associates an existing user (already logged in) with a hotel via its
 * invite key. Sets role to 'staff'. The hotel owner/manager can later
 * promote them.
 */
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { inviteKey } = await req.json()
    if (!inviteKey?.trim()) {
      return NextResponse.json({ error: 'inviteKey is required' }, { status: 400 })
    }

    await connectDB()

    const hotel = await Hotel.findOne({ inviteKey: inviteKey.toUpperCase().trim() })
    if (!hotel) {
      return NextResponse.json({ error: 'Invalid invite key — hotel not found' }, { status: 404 })
    }

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.hotelId) {
      return NextResponse.json(
        { error: 'You are already associated with a hotel. Contact your admin to switch.' },
        { status: 409 }
      )
    }

    user.hotelId = hotel._id as any
    user.role = 'staff'
    await user.save()

    return NextResponse.json({ hotelId: hotel._id.toString(), hotelName: hotel.name })
  } catch (err: any) {
    console.error('[join] Error:', err)
    return NextResponse.json({ error: 'Failed to join hotel' }, { status: 500 })
  }
}
