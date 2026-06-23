'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-pri)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background var(--t-slow), color var(--t-slow)',
      }}
    >
      {/* Background Floating Orbs (Animations for Premium Feel) */}
      <div
        style={{
          position: 'absolute',
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
          position: 'absolute',
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
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
          border-radius: var(--r-lg);
          padding: var(--sp-lg);
          display: flex;
          flex-direction: column;
          justify-content: center;
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
            aspect-ratio: auto;
            grid-template-rows: auto;
          }
          .lp-flow-grid,
          .lp-roles-grid {
            grid-template-columns: 1fr;
          }
          .lp-flow-arrow {
            display: none;
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
          transform: translateY(-2px);
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
      `}</style>

      {/* Navigation Header */}
      <header className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
          <Image
            src="/logo.png"
            alt="SyncZen"
            width={38}
            height={38}
            style={{ borderRadius: 'var(--r-sm)', objectFit: 'contain' }}
          />
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, letterSpacing: '-0.5px' }}>SyncZen</span>
        </div>
        <div>
          <Link href="/login" className="btn btn-primary btn-sm" id="nav-btn-get-started" style={{ padding: '8px 18px' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Split Layout Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: 'var(--sp-md) 0' }}>
        <div className="main-container">

          {/* Left Panel: Logo, Branding, Description (Centered) */}
          <div className="left-panel">
            <Image
              src="/logo.png"
              alt="SyncZen Cloud"
              width={160}
              height={160}
              style={{
                borderRadius: 'var(--r-md)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px var(--accent-glow))',
                marginBottom: 'var(--sp-sm)',
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
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-sec)',
                lineHeight: 1.6,
                margin: '4px 0 12px 0',
                maxWidth: '480px',
              }}
            >
              An elegant, cloud-based property management system designed for speed. Process check-ins with an interactive 4-step wizard, crop guest avatars in-browser, and manage room allocations from one glassmorphic screen.
            </p>

            <div style={{ width: '100%', maxWidth: '240px' }}>
              <Link href="/login" className="hero-btn-primary" id="hero-get-started" style={{ width: '100%' }}>
                Get Started
              </Link>
            </div>
          </div>

          {/* Right Panel: Features 2x2 Square Grid */}
          <div className="right-panel">
            <div className="features-square-grid">
              {[
                {
                  icon: '⚡',
                  color: 'var(--accent)',
                  title: 'Check-In Wizard',
                  desc: 'A linear 4-step workflow to register guests, specify ID details, allocate rooms, and calculate stays.',
                },
                {
                  icon: '📸',
                  color: 'var(--purple)',
                  title: 'In-Browser Crop',
                  desc: 'Crop, scale, and adjust guest avatars directly before saving check-in files to ensure optimized resolution.',
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
                <div key={idx} className="square-card">
                  <div
                    style={{
                      fontSize: '22px',
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--r-md)',
                      background: `${feat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${feat.color}25`,
                      flexShrink: 0,
                    }}
                  >
                    {feat.icon}
                  </div>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--text-pri)', margin: 0 }}>
                    {feat.title}
                  </h4>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-sec)', margin: 0, lineHeight: 1.4 }}>
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Dashboard Preview Section */}
      <section
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: 'var(--sp-2xl) auto 0 auto',
          padding: '0 var(--sp-2xl)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-sm)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-xs)' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Interactive Operations Dashboard
          </h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 'var(--sp-xs) 0 0 0' }}>
            A unified center featuring live status statistics and real-time hotel activity logs.
          </p>
        </div>

        {/* Dashboard preview card */}
        <div className="lp-hero-preview">
          <div className="lp-preview-card">
            <div className="lp-preview-bar">
              <span className="lp-preview-dot red" />
              <span className="lp-preview-dot amber" />
              <span className="lp-preview-dot green" />
              <span className="lp-preview-url">synczen.cloud/dashboard</span>
            </div>
            <div className="lp-preview-body">
              {/* Mini dashboard mockup */}
              <div className="lp-mini-sidebar">
                <div className="lp-mini-brand" />
                {['Dashboard', 'Rooms', 'Bookings', 'Employees', 'Logs'].map(n => (
                  <div
                    key={n}
                    className={`lp-mini-nav-item${activeTab === n ? ' lp-mini-active' : ''}`}
                    onClick={() => setActiveTab(n)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="lp-mini-nav-dot" />
                    <span>{n}</span>
                  </div>
                ))}
              </div>
              <div className="lp-mini-main">
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
                    <div className="lp-mini-table-head">
                      <span>Active Bookings</span>
                      <span className="lp-mini-badge">Live</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { guest: 'Aarav Sharma', room: '204', rate: '$120', status: 'Confirmed' },
                        { guest: 'Priya Mehta', room: '310', rate: '$150', status: 'Active' },
                        { guest: 'Kabir Sen', room: '105', rate: '$95', status: 'Pending' },
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
                        { name: 'Felix Carter', role: 'Owner', weight: '50', color: 'blue' },
                        { name: 'Elena Rostova', role: 'Manager', weight: '30', color: 'amber' },
                        { name: 'Rohan Das', role: 'Staff', weight: '10', color: 'green' },
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
                        { action: 'Staff check-in Aarav Sharma', time: '2m ago', icon: '🔑' },
                        { action: 'Staff checkout Sarah Jenkins', time: '15m ago', icon: '🚪' },
                        { action: 'Manager override rate Room 310', time: '1h ago', icon: '💰' },
                        { action: 'Admin updated settings', time: '4h ago', icon: '⚙️' },
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Check-In Flow Section */}
      <section
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: 'var(--sp-2xl) auto 0 auto',
          padding: '0 var(--sp-2xl)',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Guest Check-In Flow
          </h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 'var(--sp-xs) 0 0 0' }}>
            From Arrival to Allocated Room in 4 Steps
          </p>
        </div>

        <div className="lp-flow-grid">
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
            <div key={idx} className="lp-flow-card">
              <div className="lp-flow-num">{step.num}</div>
              <h3 className="lp-flow-title">{step.title}</h3>
              <p className="lp-flow-desc">{step.desc}</p>
              {idx < 3 && <div className="lp-flow-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Access Control Section */}
      <section
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: 'var(--sp-2xl) auto 0 auto',
          padding: '0 var(--sp-2xl)',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Access Control
          </h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 'var(--sp-xs) 0 0 0' }}>
            The Right Access for the Right Person
          </p>
        </div>

        <div className="lp-roles-grid">
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
            <div key={idx} className={`lp-role-card ${role.class}`}>
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
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: 'var(--sp-2xl) auto 0 auto',
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

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>Capability</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>Legacy PMS</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 800 }}>SyncZen Cloud</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Check-In Logging', legacy: 'Complex multi-tab forms', modern: 'Smooth 4-step check-in wizard' },
                  { name: 'Guest Avatars', legacy: 'Manual scanners / local files', modern: 'In-browser crop & secure CDN storage' },
                  { name: 'Interface Customization', legacy: 'Rigid Windows 98 layouts', modern: 'Glassmorphic Dark / Light mode' },
                  { name: 'Audit Trails', legacy: 'None or hidden inside flat logs', modern: 'Dynamic employee activity logger' },
                  { name: 'Room Rates', legacy: 'Locked standard price tags', modern: 'On-the-fly custom overrides' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', textAlign: 'center' }}>{row.legacy}</td>
                    <td style={{ padding: '14px 12px', fontSize: 'var(--fs-sm)', color: 'var(--text-pri)', fontWeight: 700, textAlign: 'center' }}>
                      {row.modern}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SyncZen Local Segment (Premium Two-Column Layout) */}
      <section className="local-promo-section" style={{ maxWidth: '1200px', margin: 'var(--sp-2xl) auto 0 auto', padding: '0 var(--sp-2xl)' }}>
        <div
          className="glass-card"
          style={{
            padding: 'var(--sp-xl)',
            borderRadius: 'var(--r-xl)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(124, 58, 237, 0.03) 100%)',
          }}
        >
          <div className="local-promo-grid">
            {/* Left Column: Local App Information */}
            <div>
              <span className="local-promo-badge">Offline & Local-First</span>
              <h2 className="local-promo-title">
                SyncZen Local Station
              </h2>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', lineHeight: 1.6, margin: '0 0 var(--sp-md) 0' }}>
                Need to run without internet dependency or external servers? **SyncZen Local** is a fully standalone offline workstation. It couples a native Electron desktop app with companion mobile check-in assistant devices over your local WiFi network.
              </p>
              
              <div className="local-feature-list">
                <div className="local-feature-item">
                  <div className="local-feature-icon">🖥️</div>
                  <div className="local-feature-text">
                    <div className="local-feature-heading">Electron Desktop Workstation</div>
                    Central hotel operations cockpit running a React + Vite frontend with an in-memory WebAssembly SQLite database (sql.js) and auto-backups directly to disk (synczen.db).
                  </div>
                </div>
                <div className="local-feature-item">
                  <div className="local-feature-icon">📱</div>
                  <div className="local-feature-text">
                    <div className="local-feature-heading">Mobile Companion Assistant</div>
                    Expo React Native mobile app. Devices connect securely by scanning a pairing QR code generated on the desktop, enabling camera photo capturing of guest profiles.
                  </div>
                </div>
                <div className="local-feature-item">
                  <div className="local-feature-icon">🔄</div>
                  <div className="local-feature-text">
                    <div className="local-feature-heading">Offline Sync Engine</div>
                    Buffers bookings and guest photos as base64 in AsyncStorage when devices are out of WiFi range. A background loop automatically flushes the queue every 15 seconds once online.
                  </div>
                </div>
                <div className="local-feature-item">
                  <div className="local-feature-icon">🛡️</div>
                  <div className="local-feature-text">
                    <div className="local-feature-heading">Complete Data Privacy</div>
                    All guest records, documents, and logs remain strictly on your own hardware inside your building. Zero cloud hosting, zero data leaks, and zero downtime.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Connection Workflow and Download Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div className="local-flow-steps">
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, margin: '0 0 var(--sp-xs) 0', color: 'var(--text-pri)' }}>
                  How Local Mode Works:
                </h4>
                <div className="local-flow-step">
                  <div className="local-flow-number">1</div>
                  <span>Launch desktop app to boot SQLite & LAN Express API</span>
                </div>
                <div className="local-flow-step">
                  <div className="local-flow-number">2</div>
                  <span>Scan Pairing QR Code from mobile app to pair devices</span>
                </div>
                <div className="local-flow-step">
                  <div className="local-flow-number">3</div>
                  <span>Register guests and take photos offline on the mobile assistant</span>
                </div>
                <div className="local-flow-step">
                  <div className="local-flow-number">4</div>
                  <span>Bookings automatically queue and sync to desktop database</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', marginTop: 'var(--sp-xs)' }}>
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
                  📄 View GitHub Repository
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          width: '100%',
          textAlign: 'center',
          padding: 'var(--sp-xl) var(--sp-lg)',
          marginTop: 'auto',
          zIndex: 10,
        }}
      >
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', margin: 0 }}>
          © {new Date().getFullYear()} SyncZen Cloud. All rights reserved.
        </p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', margin: '4px 0 0 0' }}>
          Author: <strong>Felix-au</strong> (Harshit Soni)
        </p>
        <p style={{ textAlign: 'center', marginTop: 'var(--sp-md)' }}>
          <sub>Built for hoteliers who value visual aesthetics and operational speed.</sub>
        </p>
      </footer>
    </div>
  )
}
