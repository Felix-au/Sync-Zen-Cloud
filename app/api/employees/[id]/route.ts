import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { auth } from '@/lib/auth'
import { canManageEmployees, canManageManagers } from '@/lib/roles'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/employees/[id]
 * Changes an employee's role.
 * - Managers can promote staff → manager and demote manager → staff,
 *   but cannot touch hotel_owner role.
 * - Only owner can promote/demote managers.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEmployees(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  const { role } = await req.json()
  const allowedRoles = ['manager', 'staff']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'role must be manager or staff' }, { status: 400 })
  }

  // Promoting to manager requires owner privilege
  if (role === 'manager' && !canManageManagers(session.user.role as any)) {
    return NextResponse.json({ error: 'Only hotel owners can promote to manager' }, { status: 403 })
  }

  await connectDB()
  const { id } = await params

  const target = await User.findOne({ _id: id, hotelId: session.user.hotelId })
  if (!target) return NextResponse.json({ error: 'Employee not found in this hotel' }, { status: 404 })

  // Cannot change the owner's role
  if (target.role === 'hotel_owner') {
    return NextResponse.json({ error: 'Cannot change the hotel owner\'s role' }, { status: 403 })
  }

  target.role = role
  await target.save()

  return NextResponse.json({
    employee: { _id: target._id, name: target.name, email: target.email, role: target.role }
  })
}

/**
 * DELETE /api/employees/[id]
 * Removes an employee from the hotel (sets hotelId → null, role → staff).
 * Does not delete the user account.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEmployees(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  await connectDB()
  const { id } = await params

  const target = await User.findOne({ _id: id, hotelId: session.user.hotelId })
  if (!target) return NextResponse.json({ error: 'Employee not found in this hotel' }, { status: 404 })

  if (target.role === 'hotel_owner') {
    return NextResponse.json({ error: 'Cannot remove the hotel owner' }, { status: 403 })
  }

  target.hotelId = null
  target.role = 'staff'
  await target.save()

  return NextResponse.json({ message: `${target.name} removed from hotel` })
}
