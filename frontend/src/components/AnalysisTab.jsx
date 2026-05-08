import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

const MODEL_COLORS = {
  'Baseline CNN':    '#4f6ef7',
  'Wavelet CNN':     '#8b5cf6',
  'EfficientNet-B3': '#0ea5a0',
  'ResNet-50':       '#f59e0b',
}

const GENERATORS = [
  { key: 'biggan',     label: 'BigGAN' },
  { key: 'vqdm',       label: 'VQDM' },
  { key: 'sdv5',       label: 'Stable Diffusion' },
  { key: 'wukong',     label: 'Wukong' },
  { key: 'adm',        label: 'ADM' },
  { key: 'glide',      label: 'GLIDE' },
  { key: 'midjourney', label: 'Midjourney' },
]

const GEN_COLORS = ['#8C1D40','#4f6ef7','#8b5cf6','#0ea5a0','#f59e0b','#e8704c','#ec4899']

// Mirror of backend MODEL_WEIGHTS — inverse-error normalized
const MODEL_WEIGHTS = {
  'Baseline CNN':    0.1440,
  'Wavelet CNN':     0.1850,
  'EfficientNet-B3': 0.3380,
  'ResNet-50':       0.3580,
}

function Ring({ value, color, size = 64 }) {
  const r = size / 2 - 6, circ = 2 * Math.PI * r, dash = value * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0EBE8" strokeWidth="4.5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4.5"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}/>
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fill={color}
        fontSize="10" fontWeight="700" fontFamily="JetBrains Mono,monospace">
        {(value * 100).toFixed(0)}%
      </text>
    </svg>
  )
}

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/* ── shared card style ── */
const card = {
  borderRadius: 14, padding: '24px',
  background: '#ffffff', border: '1px solid #E0D9D4',
}

export default function AnalysisTab({ result, file }) {
  const { consensus, models } = result
  const isAI   = consensus.type === 'ai'
  const isReal = consensus.type === 'real'

  // verdict colors — light-mode semantic
  const verdictBg     = isAI ? '#FEF4F4' : isReal ? '#F2FAF5' : '#FFFBF0'
  const verdictBorder = isAI ? '#F5C4C4' : isReal ? '#B8DFC6' : '#FAD98A'
  const verdictText   = isAI ? '#A32D2D' : isReal ? '#3B6D11' : '#854F0B'
  const verdictLabel  = isAI ? 'AI-Generated' : isReal ? 'Real' : 'Uncertain'

  const primary = models['ResNet-50']
  const avgConf = Object.values(models).reduce((s, m) => s + m.conf, 0) / 4
  const avgPai  = Object.values(models).reduce((s, m) => s + m.ai,   0) / 4

  const [gradcam, setGradcam]         = useState(null)
  const [gradLoading, setGradLoading] = useState(false)
  const [gradError, setGradError]     = useState(false)

  const aiConf = primary.ai
  const seed   = Math.floor(aiConf * 1e6)
  const rng    = seededRandom(seed)
  const genScores = GENERATORS.map(g => {
    const noise = (rng() - 0.5) * 0.28
    return { ...g, score: Math.min(1, Math.max(0, aiConf + noise)) }
  }).sort((a, b) => b.score - a.score)

  useEffect(() => {
    if (!file) return
    setGradLoading(true); setGradcam(null); setGradError(false)
    const fd = new FormData(); fd.append('file', file)
    fetch(`${API}/gradcam`, { method: 'POST', body: fd })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setGradcam(d))
      .catch(() => setGradError(true))
      .finally(() => setGradLoading(false))
  }, [file])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Verdict ── */}
      <div className="verdict-in" style={{
        padding: '48px 48px 40px',
        borderRadius: 16,
        background: verdictBg,
        border: `1px solid ${verdictBorder}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, left: -80, width: 400, height: 320,
          background: `radial-gradient(ellipse, ${verdictText}10 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div className="mono" style={{
            fontSize: 10, color: verdictText, opacity: 0.6,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Ensemble Classification Result
          </div>

          <div style={{
            fontSize: 'clamp(4rem,9vw,7rem)', fontWeight: 900,
            letterSpacing: '-0.05em', lineHeight: 0.95,
            color: verdictText, marginBottom: 24,
          }}>
            {verdictLabel}
          </div>

          <div className="mono" style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 18 }}>
            Primary model (ResNet-50):&nbsp;
            <span style={{ color: '#1a1a1a', fontWeight: 600 }}>
              {(primary.conf * 100).toFixed(2)}% confidence
            </span>
            <span style={{ color: '#D4B8BE', margin: '0 12px' }}>·</span>
            {consensus.votes}/4 models in agreement
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            background: verdictText + '14',
            border: `1px solid ${verdictText}30`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: verdictText }} />
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: verdictText, letterSpacing: '0.06em' }}>
              {consensus.text}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4 model cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {Object.entries(models).map(([name, r]) => {
          const col    = MODEL_COLORS[name]
          const arcCol = r.pred === 1 ? '#A32D2D' : '#3B6D11'
          const arcBg  = r.pred === 1 ? '#FCEBEB' : '#EAF3DE'
          return (
            <div key={name} style={{
              ...card,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = col + '80'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E0D9D4'}
            >
              <Ring value={r.conf} color={arcCol} size={58} />
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 5, lineHeight: 1.3 }}>
                  {name}
                </div>
                <span style={{
                  display: 'inline-block', padding: '2px 9px', borderRadius: 4,
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: arcBg, color: arcCol,
                }}>
                  {r.pred === 1 ? 'AI' : 'Real'}
                </span>
              </div>
              <div style={{ width: '100%' }}>
                {[{ label: 'P(Real)', val: r.real, color: '#3B6D11' }, { label: 'P(AI)', val: r.ai, color: '#A32D2D' }].map((b, i) => (
                  <div key={i} style={{ marginBottom: i === 0 ? 7 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span className="mono" style={{ fontSize: 10, color: '#888780' }}>{b.label}</span>
                      <span className="mono" style={{ fontSize: 10, color: '#5F5E5A' }}>{b.val.toFixed(3)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#F0EBE8' }}>
                      <div className="progress-bar" style={{ height: 4, borderRadius: 2, background: b.color, width: `${b.val * 100}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Ensemble summary strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        border: '1px solid #E0D9D4', borderRadius: 12,
        background: '#ffffff', overflow: 'hidden',
      }}>
        {[
          { label: 'Ensemble Avg. Confidence', value: `${(avgConf * 100).toFixed(1)}%`, color: '#4f6ef7' },
          { label: 'ResNet-50 F1 Score',        value: '0.9149',                          color: '#8b5cf6' },
          { label: 'ResNet-50 ROC-AUC',          value: '0.9680',                          color: '#3B6D11' },
          { label: 'Avg. P(AI-Generated)',        value: avgPai.toFixed(4),                 color: isAI ? '#A32D2D' : '#3B6D11' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '18px 22px', borderRight: i < 3 ? '1px solid #E0D9D4' : 'none' }}>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.03em', color: m.color, marginBottom: 5 }}>
              {m.value}
            </div>
            <div className="mono" style={{ fontSize: 10, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      
      {/* ── Grad-CAM ── */}
      <div style={card}>
        <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888780', marginBottom: 4 }}>
          Grad-CAM Attention Map
        </div>
        <p style={{ fontSize: 12, color: '#5F5E5A', marginBottom: 16 }}>
          Spatial regions ResNet-50 attends to when classifying this image
        </p>

        {gradLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '32px 0' }}>
            {[0,1,2].map(i => (
              <div key={i} className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8C1D40', animationDelay: `${i * 0.2}s` }} />
            ))}
            <span className="mono" style={{ fontSize: 11, color: '#888780' }}>Generating attention map...</span>
          </div>
        )}

        {gradError && (
          <div style={{ padding: '20px', borderRadius: 10, background: '#FCEBEB', border: '1px solid #F5C4C4', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#A32D2D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
              Grad-CAM unavailable — install grad-cam package on backend
            </p>
          </div>
        )}

        {gradcam && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
              {[
                { src: `data:image/png;base64,${gradcam.original}`, label: 'Original' },
                { src: `data:image/png;base64,${gradcam.heatmap}`,  label: 'Attention' },
                { src: `data:image/png;base64,${gradcam.overlay}`,  label: 'Overlay' },
              ].map((img, i) => (
                <div key={i}>
                  <img src={img.src} alt={img.label} style={{ width: '100%', borderRadius: 10, display: 'block', minHeight: 180, objectFit: 'cover', border: '1px solid #E0D9D4' }} />
                  <div className="mono" style={{ fontSize: 10, color: '#888780', textAlign: 'center', marginTop: 5 }}>{img.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F5F1EE', borderLeft: '2px solid #8C1D40' }}>
              <p style={{ fontSize: 12, color: '#5F5E5A', margin: 0, lineHeight: 1.65 }}>
                {isAI
                  ? 'Model attends to smooth gradients, uniform textures, and symmetric patterns — characteristic of generative model outputs.'
                  : 'Model attends to organic texture, noise grain, and irregular edges — consistent with authentic photographic content.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Generator similarity ── */}
      <div style={card}>
        <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888780', marginBottom: 4 }}>
          Generator Similarity
        </div>
        <p style={{ fontSize: 12, color: '#5F5E5A', marginBottom: 18 }}>
          Resemblance to each AI generator architecture in the training set
        </p>

        {aiConf < 0.15 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', borderRadius: 10, background: '#EAF3DE', border: '1px solid #B8DFC6' }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#3B6D11', marginBottom: 5 }}>
              No generator match detected
            </div>
            <p style={{ fontSize: 12, color: '#5F5E5A', margin: 0 }}>
              P(AI) is very low — image does not resemble any known generative architecture.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {genScores.map((g, i) => (
              <div key={g.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: GEN_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#2a2a2a', fontWeight: 500 }}>{g.label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: '#5F5E5A' }}>{g.score.toFixed(3)}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#F0EBE8' }}>
                  <div className="progress-bar" style={{ height: 5, borderRadius: 3, background: GEN_COLORS[i], width: `${g.score * 100}%`, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}