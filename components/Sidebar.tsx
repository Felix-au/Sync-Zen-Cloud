'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeProvider'

interface NavItem {
  href: string
  label: string
  icon: string
  roles?: string[]
}

const HOTEL_NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⊞' },
  { href: '/rooms',      label: 'Rooms',       icon: '🏠' },
  { href: '/checkin',    label: 'Check-In',    icon: '✚', roles: ['hotel_owner','manager','staff'] },
  { href: '/bookings',   label: 'Bookings',    icon: '📋' },
  { href: '/employees',  label: 'Employees',   icon: '👥', roles: ['hotel_owner','manager'] },
  { href: '/settings',   label: 'Settings',    icon: '⚙️',  roles: ['hotel_owner'] },
]

const SUPER_NAV: NavItem[] = [
  { href: '/super/dashboard', label: 'All Hotels', icon: '🌐' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

/* ── SVG icons ─────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname   = usePathname()
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const role = session?.user?.role as string | undefined

  const isSuper = role === 'super_admin'
  const nav = isSuper ? SUPER_NAV : HOTEL_NAV.filter(item =>
    !item.roles || item.roles.includes(role ?? '')
  )

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <Image src="/logo.png" alt="SyncZen Cloud" width={36} height={36} style={{ borderRadius: 8, objectFit: 'contain' }} />
        <div>
          <div className="sidebar-name">SyncZen Cloud</div>
          <div className="sidebar-tag">{isSuper ? 'Super Admin' : 'Hotel Cloud'}</div>
        </div>

        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          aria-label="Close menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-sec)', fontSize: 11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {session?.user?.name}
          </span>
          <span style={{ textTransform: 'capitalize', color: 'var(--accent)', fontSize: 10 }}>
            {role?.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display:'flex', gap: 4, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="icon-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="icon-btn icon-btn-danger"
            title="Sign out"
            aria-label="Sign out"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  )
}
