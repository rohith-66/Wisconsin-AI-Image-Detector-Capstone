import { useState } from 'react'
import AnalysisTab from './AnalysisTab'
import MetricsTab from './MetricsTab'
import ForensicTab from './ForensicTab'

const TABS = [
  { label: 'Analysis',        desc: 'Classification result' },
  { label: 'Metrics',         desc: 'Evaluation data' },
  { label: 'Forensic Report', desc: 'AI explanation' },
]

export default function ResultsTabs({ result, file, loading }) {
  const [active, setActive] = useState(0)

  if (loading) {
    return (
      <div style={{ marginTop: 40 }}>
        <div className="shimmer" style={{ height: 80, marginBottom: 20, borderRadius: 14 }} />
        <div className="shimmer" style={{ height: 420, borderRadius: 14 }} />
      </div>
    )
  }
  if (!result) return null

  return (
    <div className="fade-in" style={{ marginTop: 48 }}>

      {/* Tab bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 28 }}>
        {TABS.map((t, i) => {
          const isActive = active === i
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: '18px 24px',
                borderRadius: 14,
                cursor: 'pointer',
                border: isActive ? '1px solid #8C1D40' : '1px solid #E0D9D4',
                background: isActive ? '#8C1D40' : '#ffffff',
                transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                textAlign: 'left',
                boxShadow: isActive ? '0 4px 20px rgba(140,29,64,0.18)' : 'none',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#FBF8F6'
                  e.currentTarget.style.borderColor = '#CEC5BF'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = '#E0D9D4'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{
                  fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                  color: isActive ? '#ffffff' : '#1a1a1a',
                }}>
                  {t.label}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 900,
                  color: isActive ? 'rgba(255,255,255,0.25)' : '#E0D9D4',
                  fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
                }}>
                  0{i + 1}
                </span>
              </div>
              <div style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: isActive ? 'rgba(255,255,255,0.55)' : '#B4B2A9',
              }}>
                {t.desc}
              </div>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="tab-slide" key={active}>
        {active === 0 && <AnalysisTab result={result} file={file} />}
        {active === 1 && <MetricsTab />}
        {active === 2 && <ForensicTab result={result} file={file} />}
      </div>
    </div>
  )
}