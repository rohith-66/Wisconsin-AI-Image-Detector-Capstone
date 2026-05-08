import { useEffect, useState } from 'react'
import pitchfork from '../assets/asu.png'

export default function Navbar() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(r => r.ok ? setStatus('online') : setStatus('error'))
      .catch(() => setStatus('error'))
  }, [])

  const statusColor = status === 'online' ? '#3B6D11' : status === 'error' ? '#A32D2D' : '#854F0B'
  const statusDot   = status === 'online' ? '#63a832' : status === 'error' ? '#e05555' : '#e0a020'
  const statusLabel = status === 'online' ? 'System Online' : status === 'error' ? 'API Offline' : 'Connecting'

  return (
    <nav style={{
      borderBottom: '1px solid #E0D9D4',
      padding: '0 36px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'rgba(250,250,249,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 50,
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <img
          src={pitchfork}
          alt="ASU Pitchfork"
          style={{ height: 72, width: 'auto', objectFit: 'contain' }}
        />

        <div style={{ width: 1, height: 28, background: '#E0D9D4' }} />

        <div>
          <div style={{
            fontSize: 15, fontWeight: 700,
            color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Team Wisconsin
          </div>
          <div style={{
            fontSize: 11, color: '#888780',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.06em', marginTop: 2,
          }}>
            MS Data Science · ASU · Spring 2026
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusDot,
            animation: 'pulse-slow 2.2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: statusColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            {statusLabel}
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: '#E0D9D4' }} />

        {/* Capstone badge */}
        <div style={{
          padding: '6px 14px',
          borderRadius: 7,
          background: '#F5F1EE',
          border: '1px solid #E0D9D4',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8C1D40',
          }}>
            Capstone 2026
          </span>
        </div>
      </div>
    </nav>
  )
}