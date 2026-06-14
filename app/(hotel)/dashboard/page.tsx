'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Stats {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  checkoutRooms: number
  activeBookings: number
  todayCheckIns: number
}

interface RecentBooking {
  _id: string
  bookingReference: string
  checkInTime: string
  guests: Array<{ name: string; isPrimary: boolean }>
  roomIds: Array<{ roomNumber: string; roomType: string }>
  status: string
  nights: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentBooking[]>([])
  const [hotel, setHotel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const role = session?.user?.role

  useEffect(() => {
    if (!session?.user) return

    // If user has no hotel, prompt to create or join one
    if (!session.user.hotelId && role !== 'super_admin') {
      setLoading(false)
      return
    }

    if (role === 'super_admin') {
      router.replace('/super/dashboard')
      return
    }

    async function load() {
      const [hotelRes, roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/hotels'),
        fetch('/api/rooms'),
        fetch('/api/bookings?limit=8'),
      ])

      const [hotelData, roomsData, bookingsData] = await Promise.all([
        hotelRes.json(),
        roomsRes.json(),
        bookingsRes.json(),
      ])

      setHotel(hotelData.hotel)
      setRecent(bookingsData.bookings ?? [])

      const rooms: any[] = roomsData.rooms ?? []
      setStats({
        totalRooms:       rooms.length,
        availableRooms:   rooms.filter(r => r.status === 'available').length,
        occupiedRooms:    rooms.filter(r => r.status === 'occupied').length,
        maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
        checkoutRooms:    rooms.filter(r => r.status === 'checkout').length,
        activeBookings:   (bookingsData.bookings ?? []).filter((b: any) => b.status === 'checked_in').length,
        todayCheckIns:    (bookingsData.bookings ?? []).filter((b: any) => {
          const d = new Date(b.checkInTime)
          const today = new Date()
          return d.toDateString() === today.toDateString()
        }).length,
      })
      setLoading(false)
    }

    load()
  }, [session, role, router])

  // No hotel yet — onboarding CTA
  if (!loading && !session?.user?.hotelId && role !== 'super_admin') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-card" style={{ padding: 'var(--sp-2xl)', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 'var(--sp-md)' }}>🏨</div>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--sp-sm)' }}>
            Welcome, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p style={{ color: 'var(--text-mute)', marginBottom: 'var(--sp-xl)', fontSize: 'var(--fs-sm)' }}>
            You&apos;re not associated with a hotel yet. Register your own hotel or join an existing team.
          </p>
          <div className="flex gap-md">
            <Link href="/settings?action=create" className="btn btn-primary flex-1" style={{ justifyContent: 'center' }}>
              Register Hotel
            </Link>
            <Link href="/join" className="btn btn-ghost flex-1" style={{ justifyContent: 'center' }}>
              Join with Key
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner spinner-lg" />
      </div>
    )
  }

  const occupancyPct = stats ? Math.round((stats.occupiedRooms / (stats.totalRooms || 1)) * 100) : 0

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">{hotel?.name ?? 'Dashboard'}</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/checkin" className="btn btn-primary">
          ✚ New Check-In
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-lg">
        {[
          { label: 'Total Rooms',    value: stats?.totalRooms    ?? 0, color: 'blue',  note: 'registered rooms' },
          { label: 'Available',      value: stats?.availableRooms ?? 0, color: 'green', note: 'ready to assign' },
          { label: 'Occupied',       value: stats?.occupiedRooms  ?? 0, color: 'amber', note: `${occupancyPct}% occupancy` },
          { label: 'Active Bookings', value: stats?.activeBookings ?? 0, color: 'blue',  note: `${stats?.todayCheckIns ?? 0} today` },
        ].map(s => (
          <div key={s.label} className={`glass-card stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="glass-card">
        <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>Recent Check-Ins</h2>
          <Link href="/bookings" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <div className="empty-title">No bookings yet</div>
            <div className="empty-text">Check-ins will appear here once guests are registered.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Primary Guest</th>
                  <th>Room(s)</th>
                  <th>Check-In</th>
                  <th>Nights</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(b => {
                  const primary = b.guests.find(g => g.isPrimary) ?? b.guests[0]
                  const rooms = b.roomIds.map((r: any) => r.roomNumber).join(', ')
                  return (
                    <tr key={b._id} onClick={() => router.push(`/bookings/${b._id}`)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {b.bookingReference}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-pri)' }}>{primary?.name}</td>
                      <td>{rooms}</td>
                      <td style={{ fontSize: 'var(--fs-xs)' }}>
                        {new Date(b.checkInTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
                      </td>
                      <td>{b.nights}</td>
                      <td>
                        <span className={`badge badge-${b.status === 'checked_in' ? 'green' : b.status === 'checked_out' ? 'muted' : 'red'}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
