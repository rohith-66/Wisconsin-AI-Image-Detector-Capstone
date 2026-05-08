import { useState } from 'react'

const STATS = [
  { value: '91.37%', label: 'Peak Test Accuracy',      sub: 'ResNet-50 · GenImage test set',       accent: '#8C1D40' },
  { value: '0.9680', label: 'ROC-AUC',                  sub: 'ResNet-50 · binary classification',   accent: '#8C1D40' },
  { value: '7',      label: 'Generative Architectures', sub: 'BigGAN · SD · GLIDE · Midjourney...', accent: '#8C1D40' },
  { value: '27,986', label: 'Training Samples',          sub: 'Balanced class distribution (50/50)', accent: '#8C1D40' },
]

function Card({ s, last }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        position: 'relative',
        padding: '24px 28px',
        borderRight: last ? 'none' : '1px solid #E0D9D4',
        background: hov ? '#FBF8F6' : '#ffffff',
        cursor: 'default',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* top accent line on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: '#8C1D40',
        borderRadius: 0,
        transform: hov ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }} />

      {/* dot */}
      <div style={{
        position: 'absolute', top: 12, right: 14,
        width: 5, height: 5, borderRadius: '50%',
        background: '#FFC627',
        opacity: hov ? 1 : 0.4,
        transition: 'opacity 0.2s ease',
      }} />

      <div className="mono" style={{
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: '#1a1a1a',
        marginBottom: 8,
      }}>
        {s.value}
      </div>

      <div className="mono" style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#8C1D40', marginBottom: 4,
      }}>
        {s.label}
      </div>

      <div style={{ fontSize: 11, color: '#888780' }}>
        {s.sub}
      </div>
    </div>
  )
}

export default function StatsBar() {
  return (
    <div className="fade-up-4" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      border: '1px solid #E0D9D4',
      borderRadius: 14,
      overflow: 'hidden',
      background: '#ffffff',
      boxShadow: '0 2px 12px rgba(140,29,64,0.05)',
      marginBottom: 64,
    }}>
      {STATS.map((s, i) => <Card key={i} s={s} last={i === 3} />)}
    </div>
  )
}