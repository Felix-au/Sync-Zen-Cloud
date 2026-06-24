'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { useSession } from 'next-auth/react'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  max?: number
  [key: string]: any
}

function TiltCard({ children, className, style, max = 10, ...props }: TiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Map mouse position to rotation angles (e.g. -max deg to max deg)
  const rotateX = useTransform(y, [-0.5, 0.5], [max, -max])
  const rotateY = useTransform(x, [-0.5, 0.5], [-max, max])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left - width / 2
    const mouseY = event.clientY - rect.top - height / 2
    x.set(mouseX / width)
    y.set(mouseY / height)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        ...style
      }}
      className={className}
      {...props}
    >
      <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d', height: '100%', width: '100%' }}>
        {children}
      </div>
    </motion.div>
  )
}

const flowGridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25
    }
  }
}

const flowCardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 40,
      damping: 12
    }
  }
}

const rolesGridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
}

const roleCardVariants = {
  hidden: { opacity: 0, rotateY: 0 },
  visible: {
    opacity: [0, 1, 1, 1],
    rotateY: [0, 30, 30, 0],
    transition: {
      duration: 1.5,
      times: [0, 0.25, 0.75, 1.0],
      ease: "easeInOut"
    }
  }
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const { theme, toggle } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDemoCheckInOpen, setIsDemoCheckInOpen] = useState(false)
  const [demoStep, setDemoStep] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [mockupSidebarOpen, setMockupSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showLoader, setShowLoader] = useState(true)
  const { data: session } = useSession()

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isContactSubmitting, setIsContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isContactSubmitting) return

    setIsContactSubmitting(true)
    setContactStatus({ type: null, message: '' })

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setContactStatus({ type: 'success', message: 'Thank you! Your message has been sent successfully.' })
        setContactName('')
        setContactEmail('')
        setContactMessage('')
      } else {
        setContactStatus({ type: 'error', message: data.message || 'Failed to send message. Please try again.' })
      }
    } catch (err) {
      console.error('Submit contact error:', err)
      setContactStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsContactSubmitting(false)
    }
  }

  useEffect(() => {
    // Enable manual scroll restoration and force scroll to top on first mount
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
      window.scrollTo(0, 0)
    }

    setIsMounted(true)
    setShowLoader(false)

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const handleScroll = () => {
      const scrollTop = Math.max(
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0
      )
      if (scrollTop > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [])

  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            key="page-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--loader-bg)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
            >
              <Image
                src="/logo.png"
                alt="SyncZen"
                width={40}
                height={40}
                style={{ borderRadius: '8px', objectFit: 'contain' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMounted && (
        <div
          style={{
            background: 'var(--bg)',
            color: 'var(--text-pri)',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'background var(--t-slow), color var(--t-slow)',
          }}
        >
          {/* Background Floating Orbs (Animations for Premium Feel) */}
          <div
            style={{
              position: 'fixed',
              top: '-10%',
              left: '10%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'driftOrbOne 20s infinite alternate ease-in-out',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: '-10%',
              right: '5%',
              width: '550px',
              height: '550px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'driftOrbTwo 25s infinite alternate ease-in-out',
            }}
          />

          <style jsx global>{`
        @keyframes driftOrbOne {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(65px, 45px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftOrbTwo {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, -50px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .main-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: var(--sp-2xl);
          padding: var(--sp-xl) var(--sp-2xl);
          z-index: 10;
        }
        .left-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: var(--sp-md);
        }
        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .features-square-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: var(--sp-md);
          width: 100%;
          aspect-ratio: 1 / 1;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--accent), var(--purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-btn-primary {
          padding: 16px 36px;
          font-size: var(--fs-md);
          border-radius: var(--r-md);
          font-weight: 700;
          transition: all var(--t-base);
          text-decoration: none;
          background: var(--accent);
          color: #ffffff;
          box-shadow: 0 4px 20px var(--accent-glow);
          border: none;
          cursor: pointer;
          display: inline-block;
          text-align: center;
        }
        .hero-btn-primary:hover {
          background: var(--accent-hi);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px var(--accent-glow);
        }
        .square-card {
          position: relative;
          overflow: hidden;
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
          border-radius: var(--r-lg);
          padding: var(--sp-lg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          gap: var(--sp-sm);
          transition: all var(--t-base);
        }
        .square-card:hover {
          border-color: var(--accent);
          box-shadow: var(--shadow-lg), 0 0 20px var(--accent-glow);
          transform: scale(1.03);
        }
        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--sp-lg) var(--sp-2xl);
          z-index: 10;
        }
        @media (max-width: 900px) {
          .main-container {
            grid-template-columns: 1fr;
            padding: var(--sp-lg);
            gap: var(--sp-2xl);
          }
          .left-panel .hero-btn-primary {
            width: 100%;
          }
          .features-square-grid {
            aspect-ratio: auto;
            grid-template-rows: auto;
          }
        }

        /* --- Dashboard Preview Mockup --- */
        .lp-hero-preview {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .lp-preview-card {
          width: 100%;
          max-width: 800px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-lg), 0 20px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform var(--t-base), box-shadow var(--t-base);
        }
        .lp-preview-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg), 0 25px 60px var(--accent-glow);
          border-color: var(--accent);
        }
        .lp-preview-bar {
          background: rgba(0, 0, 0, 0.03);
          border-bottom: 1px solid var(--border);
          padding: var(--sp-sm) var(--sp-md);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-preview-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .lp-preview-dot.red { background: #ff5f56; }
        .lp-preview-dot.amber { background: #ffbd2e; }
        .lp-preview-dot.green { background: #27c93f; }
        .lp-preview-url {
          margin-left: var(--sp-md);
          font-size: 11px;
          color: var(--text-mute);
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 12px;
          border-radius: var(--r-xs);
          letter-spacing: 0.3px;
          flex: 1;
          max-width: 250px;
        }
        .lp-preview-body {
          display: flex;
          height: 380px;
          overflow: hidden;
        }
        /* Sidebar in preview */
        .lp-mini-sidebar {
          width: 150px;
          background: rgba(0, 0, 0, 0.015);
          border-right: 1px solid var(--border);
          padding: var(--sp-md) var(--sp-sm);
          display: flex;
          flex-direction: column;
          gap: var(--sp-xs);
        }
        .lp-mini-brand {
          height: 16px;
          width: 60px;
          background: var(--accent);
          border-radius: var(--r-xs);
          margin-bottom: var(--sp-md);
          opacity: 0.85;
        }
        .lp-mini-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: var(--r-xs);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-sec);
        }
        .lp-mini-nav-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--text-mute);
        }
        .lp-mini-active {
          background: var(--accent-dim);
          color: var(--accent);
        }
        .lp-mini-active .lp-mini-nav-dot {
          background: var(--accent);
        }
        /* Main pane in preview */
        .lp-mini-main {
          flex: 1;
          padding: var(--sp-md);
          display: flex;
          flex-direction: column;
          gap: var(--sp-md);
          overflow-y: auto;
        }
        .lp-mini-stats-row {
          display: flex;
          gap: var(--sp-sm);
        }
        .lp-mini-stat {
          flex: 1;
          padding: var(--sp-sm) var(--sp-md);
          border-radius: var(--r-md);
          border: 1px solid var(--border);
          background: var(--surface);
        }
        .lp-mini-stat-blue {
          border-left: 3px solid var(--accent);
        }
        .lp-mini-stat-green {
          border-left: 3px solid var(--green);
        }
        .lp-mini-stat-amber {
          border-left: 3px solid var(--amber);
        }
        .lp-mini-stat-val {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-pri);
          line-height: 1.2;
        }
        .lp-mini-stat-lbl {
          font-size: 9px;
          color: var(--text-mute);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .lp-mini-table-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-pri);
          border-bottom: 1px solid var(--border);
          padding-bottom: 4px;
        }
        .lp-mini-badge {
          background: var(--green-dim);
          color: var(--green);
          font-size: 9px;
          padding: 1px 6px;
          border-radius: var(--r-full);
          font-weight: 800;
          text-transform: uppercase;
        }
        .lp-mini-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: var(--sp-xs) 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        }
        .lp-mini-row:last-child {
          border-bottom: none;
        }
        .lp-mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-dim);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }
        .lp-mini-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .lp-mini-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-pri);
        }
        .lp-mini-room {
          font-size: 9px;
          color: var(--text-mute);
        }
        .lp-mini-time {
          font-size: 9px;
          color: var(--text-mute);
        }

        /* --- Guest Check-In Flow --- */
        .lp-flow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--sp-md);
          margin-top: var(--sp-lg);
        }
        .lp-flow-card {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--r-lg);
          padding: var(--sp-lg);
          display: flex;
          flex-direction: column;
          gap: var(--sp-sm);
          position: relative;
          transition: all var(--t-base);
        }
        .lp-flow-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md), 0 0 15px var(--accent-glow);
        }
        .lp-flow-num {
          font-size: var(--fs-xl);
          font-weight: 900;
          color: var(--accent);
          opacity: 0.85;
          letter-spacing: -0.5px;
        }
        .lp-flow-title {
          font-size: var(--fs-sm);
          font-weight: 800;
          color: var(--text-pri);
        }
        .lp-flow-desc {
          font-size: var(--fs-xs);
          color: var(--text-sec);
          line-height: 1.5;
        }
        .lp-flow-arrow {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: var(--text-mute);
          z-index: 2;
        }

        /* --- Access Control Roles --- */
        .lp-roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-md);
          margin-top: var(--sp-lg);
        }
        .lp-role-card {
          background: var(--glass-bg);
          backdrop-filter: blur(15px);
          border: 1px solid var(--glass-border);
          border-radius: var(--r-lg);
          padding: var(--sp-lg);
          display: flex;
          flex-direction: column;
          gap: var(--sp-md);
          transition: all var(--t-base);
        }
        .lp-role-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .lp-role-card.role-admin { border-top: 4px solid var(--purple); }
        .lp-role-card.role-owner { border-top: 4px solid var(--accent); }
        .lp-role-card.role-manager { border-top: 4px solid var(--amber); }
        .lp-role-card.role-staff { border-top: 4px solid var(--green); }
        
        .lp-role-header {
          display: flex;
          flex-direction: column;
          gap: var(--sp-xs);
        }
        .lp-role-title-row {
          display: flex;
          align-items: center;
          gap: var(--sp-xs);
        }
        .lp-role-icon {
          font-size: 20px;
        }
        .lp-role-title {
          font-size: var(--fs-md);
          font-weight: 800;
          color: var(--text-pri);
        }
        .lp-role-weight {
          font-size: 10px;
          color: var(--text-mute);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .lp-role-list {
          display: flex;
          flex-direction: column;
          gap: var(--sp-xs);
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .lp-role-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: var(--fs-xs);
          color: var(--text-sec);
          line-height: 1.4;
        }
        .lp-role-check {
          color: var(--green);
          font-weight: bold;
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .main-container {
            grid-template-columns: 1fr;
            padding: var(--sp-lg);
            gap: var(--sp-2xl);
          }
          .left-panel .hero-btn-primary {
            width: 100%;
          }
          .features-square-grid {
            grid-template-columns: 1fr;
            aspect-ratio: auto;
            grid-template-rows: auto;
            gap: var(--sp-md);
          }
          .lp-flow-grid,
          .lp-roles-grid {
            grid-template-columns: 1fr;
          }
          .lp-flow-arrow {
            display: none;
          }

          /* Mobile Dashboard Mockup Layout Adjustments */
          .lp-preview-body {
            flex-direction: column;
            height: 480px;
          }
          .lp-mini-stats-row {
            gap: 6px;
          }
          .lp-mini-stat {
            padding: 4px 6px;
          }
          .lp-mini-stat-val {
            font-size: 14px;
          }
          .lp-mini-stat-lbl {
            font-size: 7px;
          }
        }

        /* --- Local Promo Section --- */
        .local-promo-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: var(--sp-xl);
          align-items: center;
          text-align: left;
        }
        .local-promo-badge {
          display: inline-block;
          background: var(--purple-dim);
          color: var(--purple);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: var(--r-full);
          margin-bottom: var(--sp-xs);
        }
        .local-promo-title {
          font-size: var(--fs-xl);
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: var(--sp-sm);
        }
        .local-feature-list {
          display: flex;
          flex-direction: column;
          gap: var(--sp-sm);
          margin-top: var(--sp-md);
        }
        .local-feature-item {
          display: flex;
          align-items: flex-start;
          gap: var(--sp-sm);
        }
        .local-feature-icon {
          font-size: 18px;
          flex-shrink: 0;
          background: rgba(124, 58, 237, 0.1);
          width: 32px;
          height: 32px;
          border-radius: var(--r-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(124, 58, 237, 0.15);
        }
        .local-feature-text {
          font-size: var(--fs-sm);
          color: var(--text-sec);
          line-height: 1.5;
        }
        .local-feature-heading {
          font-weight: 800;
          color: var(--text-pri);
          margin-bottom: 2px;
        }
        .local-flow-steps {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: var(--sp-md);
          display: flex;
          flex-direction: column;
          gap: var(--sp-sm);
        }
        .local-flow-step {
          display: flex;
          align-items: center;
          gap: var(--sp-sm);
          font-size: var(--fs-xs);
          color: var(--text-sec);
        }
        .local-flow-number {
          background: var(--accent-dim);
          color: var(--accent);
          font-weight: 800;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .local-btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-xs);
          background: var(--accent);
          color: #ffffff;
          padding: 14px 28px;
          border-radius: var(--r-md);
          font-weight: 800;
          font-size: var(--fs-sm);
          transition: all var(--t-base);
          box-shadow: 0 4px 15px var(--accent-glow);
          text-decoration: none;
        }
        .local-btn-download:hover {
          background: var(--accent-hi);
          box-shadow: 0 6px 20px var(--accent-glow);
        }
        .local-btn-github {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-xs);
          background: var(--surface);
          color: var(--text-sec);
          border: 1px solid var(--border-hi);
          padding: 14px 28px;
          border-radius: var(--r-md);
          font-weight: 800;
          font-size: var(--fs-sm);
          transition: all var(--t-base);
          text-decoration: none;
        }
        .local-btn-github:hover {
          background: var(--elevated);
          color: var(--text-pri);
        }
        @media (max-width: 900px) {
          .local-promo-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: var(--sp-lg);
          }
          .local-feature-item {
            text-align: left;
          }
          .local-promo-badge {
            margin: 0 auto var(--sp-xs) auto;
          }
        }
        .btn-theme-toggle {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-pri);
          padding: 8px 12px;
          border-radius: var(--r-md);
          font-size: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--t-base);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .btn-theme-toggle:hover {
          background: var(--glass-hover);
          border-color: var(--border-hi);
          transform: scale(1.05);
        }

        /* Scroll Snap Slide System */
        @media (min-width: 901px) {
          html, body {
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            overflow-y: scroll;
            height: 100%;
          }
          .slide-section {
            height: 100vh;
            min-height: 100vh;
            scroll-snap-align: start;
            scroll-snap-stop: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            width: 100%;
            overflow: hidden;
          }
        }
        @media (max-width: 900px) {
          .slide-section {
            width: 100%;
            padding: 100px var(--sp-md) var(--sp-xl) var(--sp-md);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }

        /* Fixed and Floating Scroll-Adaptive Header */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 100%;
          padding: var(--sp-md) var(--sp-2xl);
          z-index: 100;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          background: var(--nav-glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--glass-border);
          border-bottom-left-radius: 20px;
          border-bottom-right-radius: 20px;
          box-shadow: 0 10px 35px rgba(59, 130, 246, 0.22), 0 2px 15px rgba(99, 102, 241, 0.15); /* stronger blueish glow */
        }

        .landing-nav.scrolled-pill {
          top: 18px;
          width: calc(100% - 32px);
          max-width: 860px;
          border-radius: var(--r-full);
          padding: 8px var(--sp-xl);
          border: 1px solid var(--border-hi);
          box-shadow: 0 12px 45px rgba(59, 130, 246, 0.35), 0 4px 25px rgba(99, 102, 241, 0.22); /* stronger blueish glow */
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--sp-md);
        }

        .nav-link {
          font-size: var(--fs-xs);
          font-weight: 700;
          color: var(--text-sec);
          padding: 6px 12px;
          border-radius: var(--r-full);
          transition: all var(--t-fast);
          cursor: pointer;
        }

        .nav-link:hover {
          color: var(--text-pri);
          background: var(--glass-hover);
        }

        @media (max-width: 860px) {
          .nav-links {
            display: none; /* Hide link row on small screens */
          }
        }

        .footer-link {
          transition: all var(--t-base) !important;
          border-radius: 6px;
          padding: 4px 8px;
          border: 1px solid transparent;
        }
        .footer-link:hover {
          color: var(--accent-hi) !important;
          background: var(--accent-dim) !important;
          border-color: var(--accent-glow) !important;
          box-shadow: 0 0 15px var(--accent-glow) !important;
          transform: translateY(-1px);
        }
      `}</style>

          {/* Navigation Header */}
          <header className={`landing-nav ${isScrolled ? 'scrolled-pill' : ''}`}>
            <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
              <Image
                src="/logo.png"
                alt="SyncZen"
                width={38}
                height={38}
                style={{ borderRadius: 'var(--r-sm)', objectFit: 'contain' }}
              />
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, letterSpacing: '-0.5px' }}>SyncZen</span>
            </a>

            {/* Navigation links to jump to slides */}
            <nav className="nav-links">
              <a href="#dashboard-demo" className="nav-link">Demo Dashboard</a>
              <a href="#features" className="nav-link">Features</a>
              <a href="#why-synczen" className="nav-link">Why SyncZen</a>
              <a href="#local-station" className="nav-link">SyncZen Local</a>
              <a href="#contact-support" className="nav-link">Contact</a>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
              <button
                onClick={toggle}
                className="btn-theme-toggle"
                aria-label="Toggle theme"
                style={{ borderRadius: 'var(--r-full)', padding: '8px' }}
              >
                {theme === 'dark' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
              <Link href={session ? "/dashboard" : "/login"} className="btn btn-primary btn-sm" id="nav-btn-get-started" style={{ padding: '8px 18px' }}>
                {session ? "Dashboard" : "Get Started"}
              </Link>
            </div>
          </header>

          {/* Hero Split Layout Container (Slide 1) */}
          <main id="hero" className="slide-section">
            <div className="main-container">

              {/* Left Panel: Logo, Branding, Description (Centered) */}
              <motion.div
                className="left-panel"
                initial={{ opacity: 0, y: isMobile ? 20 : 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              >
                <Image
                  src="/logo.png"
                  alt="SyncZen Cloud"
                  width={isMobile ? 100 : 160}
                  height={isMobile ? 100 : 160}
                  style={{
                    borderRadius: 'var(--r-md)',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 16px var(--accent-glow))',
                    marginBottom: '-16px',
                    transition: 'all var(--t-base)',
                  }}
                />
                <h1
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 900,
                    letterSpacing: '-2.5px',
                    lineHeight: 1.05,
                    margin: 0,
                  }}
                >
                  <span className="gradient-text">SyncZen Cloud</span>
                </h1>
                <p
                  style={{
                    fontSize: 'var(--fs-md)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: 0,
                  }}
                >
                  Hotel Check-In & Operations
                </p>

                <div style={{ width: '100%', maxWidth: '240px' }}>
                  <Link href={session ? "/dashboard" : "/login"} className="hero-btn-primary" id="hero-get-started" style={{ width: '100%' }}>
                    {session ? "Dashboard" : "Get Started"}
                  </Link>
                </div>
              </motion.div>

              {/* Right Panel: Features 2x2 Square Grid */}
              <div className="right-panel">
                <div className="features-square-grid">
                  {[
                    {
                      icon: '⚡',
                      color: 'var(--accent)',
                      title: 'Simple to Use',
                      desc: 'A clean, intuitive 4-step check-in workflow that simplifies guest registration, room selection, and billing.',
                    },
                    {
                      icon: '📸',
                      color: 'var(--purple)',
                      title: 'Self-Contained',
                      desc: 'Zero external dependencies or setups required. Crop, scale, and manage guest documents entirely within your browser.',
                    },
                    {
                      icon: '☁️',
                      color: 'var(--green)',
                      title: 'Secure Storage',
                      desc: 'Stream guest media and ID document proofs instantly from our secure storage servers.',
                    },
                    {
                      icon: '🛡️',
                      color: 'var(--amber)',
                      title: 'Granular Access',
                      desc: 'Weighted role-based permissions restrict staff actions and protect hotel properties.',
                    },
                  ].map((feat, idx) => (
                    <motion.div
                      key={idx}
                      className="square-card"
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                        x: isMobile ? 0 : (idx % 2 === 0 ? -250 : 250),
                        y: isMobile ? 30 : (idx < 2 ? -250 : 250)
                      }}
                      whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      viewport={{ once: true, amount: 0.05 }}
                      transition={{
                        type: 'spring',
                        stiffness: 50,
                        damping: 14,
                        delay: isMobile ? 0.05 * idx : 0.1 * idx
                      }}
                      whileHover={{ scale: 1.03 }}
                    >
                      {/* Large absolute background watermark icon */}
                      <div
                        style={{
                          position: 'absolute',
                          right: '-15px',
                          bottom: '-25px',
                          fontSize: '110px',
                          opacity: 0.08,
                          transform: 'rotate(-15deg)',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          color: feat.color,
                        }}
                      >
                        {feat.icon}
                      </div>

                      {/* Content */}
                      <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--text-pri)', margin: 0, zIndex: 2 }}>
                        {feat.title}
                      </h4>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-sec)', margin: 0, lineHeight: 1.4, zIndex: 2 }}>
                        {feat.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </main>

          {/* Slide 2: Dashboard Preview Section */}
          <section id="dashboard-demo" className="slide-section">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              style={{
                width: '100%',
                maxWidth: '1200px',
                padding: '0 var(--sp-2xl)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '2px' }}>
                  Interactive Operations Dashboard
                </h2>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', margin: '0' }}>
                  A unified center featuring live status statistics and real-time hotel activity logs.
                </p>
              </div>

              {/* Dashboard preview card */}
              <motion.div
                className="lp-hero-preview"
                style={{
                  marginTop: '0px',
                  perspective: 1200,
                  transformStyle: 'preserve-3d',
                  animation: 'none'
                }}
                initial={{ opacity: 0, scale: 0.8, rotateX: 20, rotateY: -45 }}
                whileInView={{ opacity: 1, scale: 1.0, rotateX: 0, rotateY: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 1.2, type: 'spring', stiffness: 40, damping: 12 }}
              >
                <div className="lp-preview-card">
                  <div className="lp-preview-bar" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                    {isMobile && (
                      <button
                        onClick={() => setMockupSidebarOpen(!mockupSidebarOpen)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-sec)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          borderRadius: 'var(--r-xs)',
                          zIndex: 60,
                        }}
                        aria-label="Toggle mockup navigation menu"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </button>
                    )}
                    <span className="lp-preview-dot red" />
                    <span className="lp-preview-dot amber" />
                    <span className="lp-preview-dot green" />
                    <span className="lp-preview-url" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      synczen.cloud/dashboard
                    </span>
                  </div>
                  <div className="lp-preview-body" style={{ position: 'relative' }}>
                    {/* Mini dashboard mockup */}
                    <AnimatePresence>
                      {(!isMobile || mockupSidebarOpen) && (
                        <motion.div
                          className="lp-mini-sidebar"
                          initial={isMobile ? { x: -150, opacity: 0 } : undefined}
                          animate={isMobile ? { x: 0, opacity: 1 } : undefined}
                          exit={isMobile ? { x: -150, opacity: 0 } : undefined}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          style={
                            isMobile
                              ? {
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '130px',
                                zIndex: 50,
                                background: 'var(--glass-bg)',
                                backdropFilter: 'blur(20px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                borderRight: '1px solid var(--glass-border)',
                                height: '100%',
                                boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 'var(--sp-md) var(--sp-xs)',
                                gap: 'var(--sp-xs)',
                              }
                              : undefined
                          }
                        >
                          <div className="lp-mini-brand" style={{ display: isMobile ? 'none' : 'block' }} />
                          {['Dashboard', 'Rooms', 'Bookings', 'Employees', 'Logs'].map(n => (
                            <div
                              key={n}
                              className={`lp-mini-nav-item${activeTab === n ? ' lp-mini-active' : ''}`}
                              onClick={() => {
                                setActiveTab(n)
                                if (isMobile) {
                                  setMockupSidebarOpen(false)
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="lp-mini-nav-dot" />
                              <span>{n}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Backdrop for mobile drawer */}
                    {isMobile && mockupSidebarOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          zIndex: 40,
                        }}
                        onClick={() => setMockupSidebarOpen(false)}
                      />
                    )}

                    <div className="lp-mini-main" style={{ position: 'relative' }}>
                      <AnimatePresence mode="wait">
                        {isDemoCheckInOpen ? (
                          <motion.div
                            key="demo-wizard"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'var(--bg)',
                              zIndex: 20,
                              padding: 'var(--sp-md)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--sp-xs)',
                              overflowY: 'auto'
                            }}
                          >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)' }}>Demo Check-In Wizard</span>
                              <button
                                onClick={() => setIsDemoCheckInOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-mute)', fontSize: '12px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>

                            {/* Step Indicators */}
                            {demoStep <= 4 ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold', padding: '2px 0' }}>
                                {['Guest', 'ID Proof', 'Room', 'Confirm'].map((name, i) => (
                                  <span key={i} style={{ color: demoStep === i + 1 ? 'var(--accent)' : 'inherit' }}>
                                    {i + 1}. {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '8px', color: '#10b981', fontWeight: 'bold', padding: '2px 0' }}>
                                🎉 Booking Confirmed Successfully
                              </div>
                            )}

                            {/* Step Contents */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', marginTop: '4px' }}>
                              {demoStep === 1 && (
                                <>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface)', padding: '6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                      <img src="/logo.png" alt="Guest Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Rohan Verma</div>
                                      <div style={{ fontSize: '8px', color: 'var(--text-sec)' }}>+91 98765 43210</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>GUEST NAME</label>
                                    <input type="text" readOnly value="Rohan Verma" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>PHONE NUMBER</label>
                                    <input type="text" readOnly value="+91 98765 43210" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                </>
                              )}

                              {demoStep === 2 && (
                                <>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>DOCUMENT TYPE</label>
                                    <input type="text" readOnly value="Aadhaar Card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>ID NUMBER</label>
                                    <input type="text" readOnly value="1234 5678 9012" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>ID ATTACHMENT</label>
                                    <div style={{ height: '32px', border: '1px dashed var(--border-hi)', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.02)' }}>
                                      <img src="/logo.png" alt="ID Document" style={{ height: '100%', objectFit: 'contain' }} />
                                      <span style={{ fontSize: '8px', color: 'var(--text-mute)' }}>aadhaar_rohan_verma.jpg</span>
                                    </div>
                                  </div>
                                </>
                              )}

                              {demoStep === 3 && (
                                <>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>SELECTED ROOM</label>
                                    <input type="text" readOnly value="Room 202" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>ROOM TYPE</label>
                                    <input type="text" readOnly value="Suite" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '8px', color: 'var(--text-mute)', fontWeight: 'bold' }}>NIGHTLY RATE</label>
                                    <input type="text" readOnly value="₹12,000 / night" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: '9px', borderRadius: '2px', color: 'var(--text-sec)' }} />
                                  </div>
                                </>
                              )}

                              {demoStep === 4 && (
                                <>
                                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                      <span style={{ color: 'var(--text-mute)' }}>Guest:</span>
                                      <span style={{ fontWeight: 'bold' }}>Rohan Verma</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                      <span style={{ color: 'var(--text-mute)' }}>ID:</span>
                                      <span>Aadhaar (Verified)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                      <span style={{ color: 'var(--text-mute)' }}>Room:</span>
                                      <span style={{ fontWeight: 'bold' }}>Room 202 (Suite)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                      <span style={{ color: 'var(--text-mute)' }}>Total:</span>
                                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹12,000 / night</span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '9px' }}>✅ Ready to Check-In</span>
                                  </div>
                                </>
                              )}

                              {demoStep === 5 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ type: 'spring', duration: 0.5 }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px 0',
                                    textAlign: 'center',
                                    flex: 1,
                                  }}
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 15 }}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#10b981',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                      border: '2px solid #10b981',
                                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                                    }}
                                  >
                                    ✓
                                  </motion.div>
                                  <motion.h3
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: 'var(--text-pri)' }}
                                  >
                                    Booking Done!
                                  </motion.h3>
                                  <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{ fontSize: '9px', color: 'var(--text-sec)', margin: 0, maxWidth: '180px', lineHeight: 1.4 }}
                                  >
                                    That is all you need to do, it&apos;s as simple as that.
                                  </motion.p>
                                </motion.div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                              {demoStep === 5 ? (
                                <button
                                  onClick={() => {
                                    setIsDemoCheckInOpen(false);
                                  }}
                                  style={{
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '2px',
                                    padding: '4px 12px',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'center',
                                  }}
                                >
                                  Done
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      if (demoStep > 1) setDemoStep(demoStep - 1);
                                      else setIsDemoCheckInOpen(false);
                                    }}
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', padding: '3px 8px', fontSize: '9px', cursor: 'pointer', color: 'var(--text-sec)' }}
                                  >
                                    {demoStep === 1 ? 'Cancel' : 'Back'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (demoStep < 4) {
                                        setDemoStep(demoStep + 1);
                                      } else {
                                        setDemoStep(5);
                                      }
                                    }}
                                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '2px', padding: '3px 8px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                                  >
                                    {demoStep === 4 ? 'Confirm Booking' : 'Next'}
                                  </button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
                          >
                            {activeTab === 'Dashboard' && (
                              <>
                                <div className="lp-mini-stats-row">
                                  {[
                                    { label: 'Total Rooms', val: '48', color: 'blue' },
                                    { label: 'Available', val: '31', color: 'green' },
                                    { label: 'Occupied', val: '17', color: 'amber' },
                                  ].map(s => (
                                    <div key={s.label} className={`lp-mini-stat lp-mini-stat-${s.color}`}>
                                      <div className="lp-mini-stat-val">{s.val}</div>
                                      <div className="lp-mini-stat-lbl">{s.label}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="lp-mini-table-head">
                                  <span>Recent Check-ins</span>
                                  <span className="lp-mini-badge">Live</span>
                                </div>
                                {[
                                  { name: 'Aarav Sharma', room: '204', time: '2m ago' },
                                  { name: 'Priya Mehta', room: '310', time: '18m ago' },
                                  { name: 'Raj Patel', room: '101', time: '1h ago' },
                                  { name: 'Siddharth Rao', room: '402', time: '2h ago' },
                                  { name: 'Neha Iyer', room: '215', time: '5h ago' },
                                ].map(g => (
                                  <div key={g.name} className="lp-mini-row">
                                    <div className="lp-mini-avatar">{g.name[0]}</div>
                                    <div className="lp-mini-info">
                                      <span className="lp-mini-name">{g.name}</span>
                                      <span className="lp-mini-room">Room {g.room}</span>
                                    </div>
                                    <span className="lp-mini-time">{g.time}</span>
                                  </div>
                                ))}
                              </>
                            )}

                            {activeTab === 'Rooms' && (
                              <>
                                <div className="lp-mini-table-head">
                                  <span>Live Room Grid</span>
                                  <span className="lp-mini-badge">Live</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                  {[
                                    { num: '101', status: 'occupied', label: 'Deluxe' },
                                    { num: '102', status: 'available', label: 'Suite' },
                                    { num: '103', status: 'maintenance', label: 'Standard' },
                                    { num: '201', status: 'available', label: 'Deluxe' },
                                    { num: '202', status: 'occupied', label: 'Suite' },
                                    { num: '203', status: 'available', label: 'Standard' },
                                  ].map(r => (
                                    <div key={r.num} style={{
                                      padding: '8px',
                                      borderRadius: 'var(--r-sm)',
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      textAlign: 'center',
                                      fontSize: '10px'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: 'var(--text-pri)' }}>{r.num}</div>
                                      <div style={{ fontSize: '8px', color: 'var(--text-mute)', marginBottom: '4px' }}>{r.label}</div>
                                      <span className={`badge badge-${r.status === 'available' ? 'green' : r.status === 'occupied' ? 'amber' : 'red'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                                        {r.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {activeTab === 'Bookings' && (
                              <>
                                <div className="lp-mini-table-head" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                  <span>Active Bookings</span>
                                  <button
                                    onClick={() => {
                                      setIsDemoCheckInOpen(true);
                                      setDemoStep(1);
                                    }}
                                    style={{
                                      background: 'var(--accent)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '2px 8px',
                                      fontSize: '8px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      height: '16px',
                                    }}
                                  >
                                    + Add Booking
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {[
                                    { guest: 'Aarav Sharma', room: '204', rate: '₹9,600', status: 'Confirmed' },
                                    { guest: 'Priya Mehta', room: '310', rate: '₹12,000', status: 'Active' },
                                    { guest: 'Kabir Sen', room: '105', rate: '₹7,600', status: 'Pending' },
                                    { guest: 'Siddharth Rao', room: '402', rate: '₹14,400', status: 'Confirmed' },
                                    { guest: 'Neha Iyer', room: '215', rate: '₹8,800', status: 'Active' },
                                    { guest: 'Aditya Verma', room: '303', rate: '₹10,800', status: 'Pending' },
                                  ].map((b, i) => (
                                    <div key={i} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px var(--sp-sm)',
                                      borderRadius: 'var(--r-sm)',
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      fontSize: '11px'
                                    }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-pri)' }}>{b.guest}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-mute)' }}>Room {b.room} • {b.rate}/night</div>
                                      </div>
                                      <span className={`badge badge-${b.status === 'Active' ? 'green' : b.status === 'Confirmed' ? 'blue' : 'amber'}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
                                        {b.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {activeTab === 'Employees' && (
                              <>
                                <div className="lp-mini-table-head">
                                  <span>Hotel Staff Roles</span>
                                  <span className="lp-mini-badge">Live</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {[
                                    { name: 'Amit Sharma', role: 'Owner', weight: '50', color: 'blue' },
                                    { name: 'Neha Patel', role: 'Manager', weight: '30', color: 'amber' },
                                    { name: 'Rohan Das', role: 'Staff', weight: '10', color: 'green' },
                                    { name: 'Vikram Malhotra', role: 'Staff', weight: '10', color: 'green' },
                                    { name: 'Sandeep Reddy', role: 'Staff', weight: '10', color: 'green' },
                                  ].map((emp, i) => (
                                    <div key={i} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px var(--sp-sm)',
                                      borderRadius: 'var(--r-sm)',
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      fontSize: '11px'
                                    }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-pri)' }}>{emp.name}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-mute)' }}>{emp.role}</div>
                                      </div>
                                      <span className={`badge badge-${emp.color}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
                                        W: {emp.weight}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {activeTab === 'Logs' && (
                              <>
                                <div className="lp-mini-table-head">
                                  <span>Activity Log</span>
                                  <span className="lp-mini-badge">Live</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {[
                                    { action: 'Vikram Malhotra check-in Aarav Sharma', time: '2m ago', icon: '🔑' },
                                    { action: 'Sandeep Reddy checkout Neha Iyer', time: '15m ago', icon: '🚪' },
                                    { action: 'Neha Patel override rate Room 310', time: '1h ago', icon: '💰' },
                                    { action: 'Amit Sharma updated settings', time: '4h ago', icon: '⚙️' },
                                    { action: 'Rohan Das allocated Room 201', time: '6h ago', icon: '🛌' },
                                  ].map((log, i) => (
                                    <div key={i} style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '8px',
                                      padding: '6px 8px',
                                      borderRadius: 'var(--r-xs)',
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      fontSize: '10px'
                                    }}>
                                      <span style={{ fontSize: '12px' }}>{log.icon}</span>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-pri)', lineHeight: '1.3' }}>{log.action}</div>
                                        <div style={{ fontSize: '8px', color: 'var(--text-mute)', marginTop: '2px' }}>{log.time}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Slide 3: Guest Check-In Flow & Access Control */}
          <section id="features" className="slide-section" style={{ zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              style={{
                width: '100%',
                maxWidth: '1200px',
                padding: '0 var(--sp-2xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '0px' }}>
                <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '2px' }}>
                  Guest Check-In Flow
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-mute)', margin: '0' }}>
                  From Arrival to Allocated Room in 4 Steps
                </p>
              </div>

              <motion.div
                className="lp-flow-grid"
                style={{ marginTop: '8px' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.05 }}
                variants={flowGridVariants}
              >
                {[
                  {
                    num: '01',
                    title: 'Guest Details',
                    desc: 'Enter name, age, phone number and crop a live photo for guest record.',
                  },
                  {
                    num: '02',
                    title: 'Upload ID Proof',
                    desc: 'Attach the group ID document and enter the ID number for verification.',
                  },
                  {
                    num: '03',
                    title: 'Select Room',
                    desc: 'Pick from the live grid of available rooms. Multi-room bookings supported.',
                  },
                  {
                    num: '04',
                    title: 'Review & Confirm',
                    desc: 'Set custom nightly rate, pick payment mode, then commit the booking.',
                  },
                ].map((step, idx) => (
                  <TiltCard
                    key={idx}
                    className="lp-flow-card"
                    variants={flowCardVariants}
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="lp-flow-num">{step.num}</div>
                    <h3 className="lp-flow-title">{step.title}</h3>
                    <p className="lp-flow-desc">{step.desc}</p>
                    {idx < 3 && <div className="lp-flow-arrow">→</div>}
                  </TiltCard>
                ))}
              </motion.div>

              {/* Access Control segment */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: '0px' }}>
                  <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '2px' }}>
                    Access Control
                  </h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-mute)', margin: '0' }}>
                    The Right Access for the Right Person
                  </p>
                </div>

                <motion.div
                  className="lp-roles-grid"
                  style={{ marginTop: '8px' }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.05 }}
                  variants={rolesGridVariants}
                >
                  {[
                    {
                      role: 'Hotel Owner',
                      class: 'role-owner',
                      icon: '🏨',
                      weight: 50,
                      permissions: [
                        'Full hotel control',
                        'Invite key management',
                        'Employee management',
                        'Settings & billing',
                      ],
                    },
                    {
                      role: 'Manager',
                      class: 'role-manager',
                      icon: '🗝️',
                      weight: 30,
                      permissions: [
                        'Add & edit rooms',
                        'Maintenance control',
                        'Staff management',
                        'View all bookings',
                      ],
                    },
                    {
                      role: 'Staff',
                      class: 'role-staff',
                      icon: '🛎️',
                      weight: 10,
                      permissions: [
                        'Process check-ins',
                        'Execute checkouts',
                        'View active bookings',
                        'Room status view',
                      ],
                    },
                  ].map((role, idx) => (
                    <TiltCard
                      key={idx}
                      className={`lp-role-card ${role.class}`}
                      variants={roleCardVariants}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="lp-role-header">
                        <div className="lp-role-title-row">
                          <span className="lp-role-icon">{role.icon}</span>
                          <h3 className="lp-role-title">{role.role}</h3>
                        </div>
                        <div className="lp-role-weight">Weight: {role.weight}</div>
                      </div>
                      <ul className="lp-role-list">
                        {role.permissions.map((perm, pIdx) => (
                          <li key={pIdx} className="lp-role-item">
                            <span className="lp-role-check">✓</span>
                            <span>{perm}</span>
                          </li>
                        ))}
                      </ul>
                    </TiltCard>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Slide 4: Comparison Section */}
          <section id="why-synczen" className="slide-section">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ type: 'spring', stiffness: 40, damping: 13 }}
              style={{
                width: '100%',
                maxWidth: '1200px',
                padding: '0 var(--sp-2xl)',
                zIndex: 10,
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 'var(--sp-xl)',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-lg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                    Why SyncZen Outperforms Legacy Systems
                  </h2>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 'var(--sp-xs) 0 0 0' }}>
                    Designed from the ground up for modern, cloud-first hospitality teams.
                  </p>
                </div>

                {!isMobile ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>Capability</th>
                          <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 800 }}>SyncZen Cloud</th>
                          <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>Legacy PMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Check-In Logging', legacy: 'Complex multi-tab forms', modern: 'Smooth 4-step check-in wizard' },
                          { name: 'Guest Avatars', legacy: 'Manual scanners / local files', modern: 'In-browser tools & secure CDN storage' },
                          { name: 'Data Analytics', legacy: 'Static end-of-day printouts', modern: 'Live interactive dashboard analytics' },
                          { name: 'Audit Trails', legacy: 'None or hidden inside flat logs', modern: 'Dynamic and easy to access activity logger' },
                          { name: 'Room Rates', legacy: 'Locked standard price tags', modern: 'On-the-fly custom overrides' },
                        ].map((row, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.4 + 0.12 * idx }}
                            style={{ borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}
                          >
                            <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{row.name}</td>
                            <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', color: 'var(--text-pri)', fontWeight: 700, textAlign: 'center' }}>
                              {row.modern}
                            </td>
                            <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', textAlign: 'center' }}>{row.legacy}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', textAlign: 'left' }}>
                    {[
                      { name: 'Check-In Logging', legacy: 'Complex multi-tab forms', modern: 'Smooth 4-step check-in wizard' },
                      { name: 'Guest Avatars', legacy: 'Manual scanners / local files', modern: 'In-browser tools & secure CDN storage' },
                      { name: 'Data Analytics', legacy: 'Static end-of-day printouts', modern: 'Live interactive dashboard analytics' },
                      { name: 'Audit Trails', legacy: 'None or hidden inside flat logs', modern: 'Dynamic and easy to access activity logger' },
                      { name: 'Room Rates', legacy: 'Locked standard price tags', modern: 'On-the-fly custom overrides' },
                    ].map((row, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.1 * idx }}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-md)',
                          padding: 'var(--sp-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--sp-sm)',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          {row.name}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                              SyncZen Cloud
                            </div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-pri)', fontWeight: 700 }}>{row.modern}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-mute)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                              Legacy PMS
                            </div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-sec)' }}>{row.legacy}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </section>

          {/* Slide 5: SyncZen Local Segment (Premium Two-Column Layout) */}
          <section id="local-station" className="slide-section">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: -20, rotateY: 45 }}
              whileInView={{ opacity: 1, scale: 1.0, rotateX: 0, rotateY: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 1.2, type: 'spring', stiffness: 40, damping: 12 }}
              style={{
                width: '100%',
                maxWidth: '1200px',
                padding: '0 var(--sp-2xl)',
                zIndex: 10,
                perspective: 1200,
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 'var(--sp-xl)',
                  borderRadius: 'var(--r-xl)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  background: 'linear-gradient(135deg, var(--surface) 0%, rgba(124, 58, 237, 0.03) 100%)',
                }}
              >
                {/* Centered Header Block (outside the grid to center relative to the entire card) */}
                <motion.div
                  initial={{ opacity: 0, y: -40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 'var(--sp-lg)' }}
                >
                  <span className="local-promo-badge">Offline & Local-First</span>
                  <h2 className="local-promo-title" style={{ marginBottom: 0 }}>
                    SyncZen Local Station
                  </h2>
                </motion.div>

                <div className="local-promo-grid">
                  {/* Left Column: Local App Information */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.p
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, amount: 0.1 }}
                      transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                      style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', lineHeight: 1.6, margin: '0 0 var(--sp-md) 0' }}
                    >
                      Need to run without internet dependency or external servers? <strong>SyncZen Local</strong> is a fully standalone offline workstation. It couples a native Electron desktop app with companion mobile check-in assistant devices over your local WiFi network.
                    </motion.p>

                    <div className="local-feature-list">
                      {[
                        { icon: '🖥️', title: 'Electron Desktop Workstation', desc: 'Central hotel operations cockpit running a React + Vite frontend with an in-memory WebAssembly SQLite database (sql.js) and auto-backups directly to disk (synczen.db).' },
                        { icon: '📱', title: 'Mobile Companion Assistant', desc: 'Expo React Native mobile app. Devices connect securely by scanning a pairing QR code generated on the desktop, enabling camera photo capturing of guest profiles.' },
                        { icon: '🔄', title: 'Offline Sync Engine', desc: 'Buffers bookings and guest photos as base64 in AsyncStorage when devices are out of WiFi range. A background loop automatically flushes the queue every 15 seconds once online.' },
                        { icon: '🛡️', title: 'Complete Data Privacy', desc: 'All guest records, documents, and logs remain strictly on your own hardware inside your building. Zero cloud hosting, zero data leaks, and zero downtime.' }
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          className="local-feature-item"
                          initial={{ opacity: 0, x: -80, scale: 0.9 }}
                          whileInView={{ opacity: 1, x: 0, scale: 1 }}
                          viewport={{ once: false, amount: 0.1 }}
                          transition={{ type: 'spring', stiffness: 60, damping: 13, delay: 0.45 + 0.1 * idx }}
                        >
                          <div className="local-feature-icon">{item.icon}</div>
                          <div className="local-feature-text">
                            <div className="local-feature-heading">{item.title}</div>
                            {item.desc}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Right Column: Connection Workflow and Download Actions */}
                  <motion.div
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="local-flow-steps">
                      <motion.h4
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.45 }}
                        style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, margin: '0 0 var(--sp-xs) 0', color: 'var(--text-pri)' }}
                      >
                        How Local Mode Works:
                      </motion.h4>
                      {[
                        'Launch desktop app to boot SQLite & LAN Express API',
                        'Scan Pairing QR Code from mobile app to pair devices',
                        'Perform check-ins on either the desktop or the mobile',
                        'Bookings automatically queue and sync to desktop database'
                      ].map((step, idx) => (
                        <motion.div
                          key={idx}
                          className="local-flow-step"
                          initial={{ opacity: 0, x: 80, scale: 0.95 }}
                          whileInView={{ opacity: 1, x: 0, scale: 1 }}
                          viewport={{ once: false, amount: 0.1 }}
                          transition={{ type: 'spring', stiffness: 60, damping: 13, delay: 0.5 + 0.08 * idx }}
                        >
                          <div className="local-flow-number">{idx + 1}</div>
                          <span>{step}</span>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', marginTop: 'var(--sp-xs)' }}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.1 }}
                      transition={{ type: 'spring', stiffness: 50, damping: 11, delay: 0.8 }}
                    >
                      <a
                        href="https://github.com/Felix-au/SyncZen-Local/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="local-btn-download"
                        id="download-local-btn"
                      >
                        📥 Download Latest Release (v1.0.0)
                      </a>
                      <a
                        href="https://github.com/Felix-au/SyncZen-Local"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="local-btn-github"
                        id="github-local-repo-btn"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span>View GitHub Repository</span>
                      </a>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Slide 6: Contact & Support (Premium Support Form) */}
          <section id="contact-support" className="slide-section">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.85, type: 'spring', stiffness: 50, damping: 14 }}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0 var(--sp-2xl)',
                zIndex: 10,
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 'var(--sp-lg)',
                  borderRadius: 'var(--r-xl)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  background: 'linear-gradient(135deg, var(--surface) 0%, rgba(124, 58, 237, 0.03) 100%)',
                }}
              >
                {/* Centered Header Block */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 80, damping: 12 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 'var(--sp-md)' }}
                >
                  <h2 className="local-promo-title" style={{ marginBottom: '8px' }}>
                    Contact Support
                  </h2>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', lineHeight: 1.5, margin: 0 }}>
                    Submit a request to developers or report an issue in the workspace
                  </p>
                </motion.div>

                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                  {contactStatus.type && (
                    <div style={{
                      background: contactStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--red-dim)',
                      border: contactStatus.type === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 'var(--r-md)',
                      padding: '10px 14px',
                      fontSize: 'var(--fs-sm)',
                      color: contactStatus.type === 'success' ? '#10b981' : 'var(--red)',
                    }}>
                      {contactStatus.message}
                    </div>
                  )}

                  <motion.div
                    className="input-group"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.25, duration: 0.5, type: 'spring', stiffness: 80, damping: 12 }}
                  >
                    <label className="input-label" htmlFor="contact-name">Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="input"
                      required
                      placeholder="Your Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      disabled={isContactSubmitting}
                    />
                  </motion.div>

                  <motion.div
                    className="input-group"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.35, duration: 0.5, type: 'spring', stiffness: 80, damping: 12 }}
                  >
                    <label className="input-label" htmlFor="contact-email">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="input"
                      required
                      placeholder="your.email@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={isContactSubmitting}
                    />
                  </motion.div>

                  <motion.div
                    className="input-group"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.45, duration: 0.5, type: 'spring', stiffness: 80, damping: 12 }}
                  >
                    <label className="input-label" htmlFor="contact-message">Message</label>
                    <textarea
                      id="contact-message"
                      className="input"
                      rows={4}
                      required
                      placeholder="How can we help you?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      disabled={isContactSubmitting}
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    className="hero-btn-primary"
                    disabled={isContactSubmitting}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.55, duration: 0.5, type: 'spring', stiffness: 80, damping: 12 }}
                    style={{
                      width: '100%',
                      marginTop: 'var(--sp-xs)',
                      padding: '12px 24px',
                      fontSize: 'var(--fs-sm)',
                      background: 'var(--accent)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isContactSubmitting ? (
                      <>
                        <span className="spinner" style={{ display: 'inline-block' }} />
                        Sending Message...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </section>

          {/* Persistent Footer */}
          <footer
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px 24px',
              background: 'var(--nav-glass-bg)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderTop: '1px solid var(--glass-border)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: '0 -10px 35px rgba(59, 130, 246, 0.22), 0 -2px 15px rgba(99, 102, 241, 0.15)',
              zIndex: 99,
              fontSize: '11px',
              color: 'var(--text-sec)',
            }}
          >
            <div style={{ textAlign: 'center', fontWeight: 600 }}>
              © 2026 SyncZen. All rights reserved.
            </div>
            <div style={{ position: 'absolute', right: '24px', display: 'flex', alignItems: 'center' }}>
              <a
                href="https://github.com/Felix-au/SyncZen-Cloud"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                className="footer-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}
