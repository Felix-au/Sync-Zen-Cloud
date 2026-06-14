'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'

/**
 * Layout shared across all authenticated hotel-app pages.
 * Manages sidebar open/close state for mobile drawer behaviour.
 */
export default function HotelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Mobile top bar — only visible on small screens */}
      <header className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="mobile-topbar-title">SyncZen Cloud</span>
        <div style={{ width: 36 }} /> {/* spacer to centre title */}
      </header>

      {/* Sidebar — drawer on mobile, fixed panel on desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop — tapping it closes the drawer */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
