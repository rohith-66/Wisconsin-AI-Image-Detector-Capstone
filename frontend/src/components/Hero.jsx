export default function Hero() {
  const meta = [
    { label: 'Architecture',        value: '4-Model Ensemble',           color: '#8C1D40', mono: false },
    { label: 'Training Dataset',    value: 'GenImage Benchmark',         color: '#1a1a1a', mono: false },
    { label: 'Explainability',      value: 'Grad-CAM + XAI Layer',       color: '#8C1D40', mono: false },
    { label: 'Inference Method',    value: '6-Pass TTA',                 color: '#1a1a1a', mono: false },
    { label: 'Deployment',          value: 'FastAPI + React',            color: '#1a1a1a', mono: false },
  ]

  return (
    <div style={{ paddingTop: 96, paddingBottom: 72 }}>

      {/* Eyebrow */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ height: 1, width: 36, background: '#D4B8BE' }} />
        <span className="mono" style={{
          fontSize: 10, color: '#B4A0A6',
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          MS Data Science Capstone — Arizona State University — Spring 2026
        </span>
      </div>

      {/* Blockquote */}
      <div className="fade-up-1" style={{ marginBottom: 28 }}>
        <blockquote style={{
          fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
          fontStyle: 'italic', fontWeight: 400,
          color: '#5F5E5A', lineHeight: 1.7,
          borderLeft: '2px solid #8C1D40',
          paddingLeft: 20, maxWidth: 1200,
          letterSpacing: '0.008em',
        }}>
          "Seeing is no longer believing. The proliferation of AI-generated imagery demands automated, data-driven methods of verification."
        </blockquote>
      </div>

      {/* Headline */}
      <div className="fade-up-2">
        <h1 style={{
          fontSize: 'clamp(2.8rem, 5vw, 4rem)',
          fontWeight: 900, letterSpacing: '-0.04em',
          lineHeight: 1.05, color: '#1a1a1a', marginBottom: 4,
        }}>
          A Data-Driven Approach
        </h1>
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 4rem)',
          fontWeight: 900, letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: 24,
          background: 'linear-gradient(135deg, #8C1D40 0%, #b8254f 45%, #FFC627 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          for Detecting AI-Generated Images
        </h1>
      </div>

      {/* Subtext */}
      <p className="fade-up-3" style={{
        fontSize: 'clamp(0.9rem, 1.4vw, 1rem)', fontWeight: 400,
        color: '#5F5E5A', lineHeight: 1.8,
        maxWidth: '84rem', letterSpacing: '0.006em',
      }}>
        An ensemble of four convolutional architectures — Baseline CNN, Haar wavelet-domain CNN,
        EfficientNet-B3, and ResNet-50 — trained on GenImage across seven generative model
        families, augmented with six-pass test-time augmentation and Grad-CAM spatial attention.
      </p>

      {/* Meta strip — system info, not duplicate metrics */}
      <div className="fade-up-4" style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'stretch',
        gap: 0, marginTop: 40,
        border: '1px solid #E0D9D4',
        borderRadius: 14, overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 2px 12px rgba(140,29,64,0.05)',
      }}>
        {meta.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
            {i > 0 && <div style={{ width: 1, background: '#E0D9D4', flexShrink: 0 }} />}
            <div
              style={{ padding: '16px 22px', flex: 1, transition: 'background 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FBF8F6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="mono" style={{
                fontSize: 9, color: '#B4B2A9',
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: item.color,
                fontFamily: item.mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}