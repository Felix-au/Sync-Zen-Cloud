import {
  hasMinRole,
  canCheckIn,
  canManageRooms,
  canManageEmployees,
  canManageManagers,
  canManageHotelSettings,
  canDeleteHotel,
  isSuperAdmin,
  belongsToHotel,
  type Role,
} from '@/lib/roles'

/**
 * Unit tests for lib/roles.ts
 *
 * These tests verify the role-weight model is correct — wrong values here
 * would silently break the entire access control system.
 */

describe('hasMinRole', () => {
  test('super_admin passes all thresholds', () => {
    expect(hasMinRole('super_admin', 'super_admin')).toBe(true)
    expect(hasMinRole('super_admin', 'hotel_owner')).toBe(true)
    expect(hasMinRole('super_admin', 'manager')).toBe(true)
    expect(hasMinRole('super_admin', 'staff')).toBe(true)
  })

  test('staff only passes staff threshold', () => {
    expect(hasMinRole('staff', 'staff')).toBe(true)
    expect(hasMinRole('staff', 'manager')).toBe(false)
    expect(hasMinRole('staff', 'hotel_owner')).toBe(false)
    expect(hasMinRole('staff', 'super_admin')).toBe(false)
  })

  test('manager passes manager and staff thresholds', () => {
    expect(hasMinRole('manager', 'staff')).toBe(true)
    expect(hasMinRole('manager', 'manager')).toBe(true)
    expect(hasMinRole('manager', 'hotel_owner')).toBe(false)
    expect(hasMinRole('manager', 'super_admin')).toBe(false)
  })
})

describe('canCheckIn', () => {
  test('allows all non-super roles', () => {
    expect(canCheckIn('staff')).toBe(true)
    expect(canCheckIn('manager')).toBe(true)
    expect(canCheckIn('hotel_owner')).toBe(true)
    expect(canCheckIn('super_admin')).toBe(true)
  })
})

describe('canManageRooms', () => {
  test('blocks staff', () => {
    expect(canManageRooms('staff')).toBe(false)
  })

  test('allows manager and above', () => {
    expect(canManageRooms('manager')).toBe(true)
    expect(canManageRooms('hotel_owner')).toBe(true)
    expect(canManageRooms('super_admin')).toBe(true)
  })
})

describe('canManageManagers', () => {
  test('blocks staff and manager', () => {
    expect(canManageManagers('staff')).toBe(false)
    expect(canManageManagers('manager')).toBe(false)
  })

  test('allows hotel_owner and super_admin', () => {
    expect(canManageManagers('hotel_owner')).toBe(true)
    expect(canManageManagers('super_admin')).toBe(true)
  })
})

describe('canDeleteHotel', () => {
  test('only hotel_owner can delete', () => {
    expect(canDeleteHotel('hotel_owner')).toBe(true)
    expect(canDeleteHotel('manager')).toBe(false)
    expect(canDeleteHotel('staff')).toBe(false)
  })

  test('super_admin cannot via canDeleteHotel (uses isSuperAdmin instead)', () => {
    // super_admin uses a separate check in the route — canDeleteHotel is just for owners
    expect(canDeleteHotel('super_admin')).toBe(false)
  })
})

describe('isSuperAdmin', () => {
  const roles: Role[] = ['hotel_owner', 'manager', 'staff']
  test('returns false for non-super roles', () => {
    roles.forEach(r => expect(isSuperAdmin(r)).toBe(false))
  })

  test('returns true only for super_admin', () => {
    expect(isSuperAdmin('super_admin')).toBe(true)
  })
})

describe('belongsToHotel', () => {
  const hotelId = 'hotel-123'

  test('super_admin can access any hotel regardless of hotelId', () => {
    expect(belongsToHotel('super_admin', null, hotelId)).toBe(true)
    expect(belongsToHotel('super_admin', 'other-hotel', hotelId)).toBe(true)
  })

  test('regular user matches only their own hotel', () => {
    expect(belongsToHotel('hotel_owner', hotelId, hotelId)).toBe(true)
    expect(belongsToHotel('hotel_owner', 'other-hotel', hotelId)).toBe(false)
    expect(belongsToHotel('manager',    hotelId, hotelId)).toBe(true)
    expect(belongsToHotel('staff',      null,    hotelId)).toBe(false)
  })
})
