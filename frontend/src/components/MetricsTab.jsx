const METRICS = [
  { name:'Baseline CNN',    color:'#4f6ef7', acc:'78.49%', f1:'0.7921', auc:'0.8761', pr:'0.81', rr:'0.75', pai:'0.76', rai:'0.82', err:'429', epct:'21.5%' },
  { name:'Wavelet CNN',     color:'#8b5cf6', acc:'83.35%', f1:'0.8335', auc:'0.9122', pr:'0.84', rr:'0.83', pai:'0.83', rai:'0.84', err:'332', epct:'16.6%' },
  { name:'EfficientNet-B3', color:'#0ea5a0', acc:'90.87%', f1:'0.9078', auc:'0.9686', pr:'0.90', rr:'0.92', pai:'0.91', rai:'0.90', err:'182', epct:'9.1%'  },
  { name:'ResNet-50',       color:'#f59e0b', acc:'91.37%', f1:'0.9149', auc:'0.9680', pr:'0.93', rr:'0.90', pai:'0.90', rai:'0.93', err:'172', epct:'8.6%', best:true },
]

const ROBUST = [
  { label:'JPEG Compression', best:'88.5% (q=95)', worst:'73.5% (q=20)', drop:'-17.9pp', color:'#4f6ef7', note:'Quality degradation attenuates high-frequency texture signals relied upon by the classifier.' },
  { label:'Gaussian Noise',   best:'81.5% (s=5)',  worst:'69.0% (s=80)', drop:'-22.4pp', color:'#8b5cf6', note:'Additive stochastic noise partially obscures the deterministic generative artifacts.' },
  { label:'Gaussian Blur',    best:'75.0% (k=1)',  worst:'51.0% (k=7)',  drop:'-40.4pp', color:'#A32D2D', note:'Greatest degradation observed. Model relies heavily on high-frequency edge and texture detail.' },
  { label:'Brightness Shift', best:'89.5% (1.5x)', worst:'87.0% (0.5x)', drop:'-4.4pp',  color:'#0ea5a0', note:'Minimal impact. Classification is largely invariant to global luminance changes.' },
]

const MODELS = [
  { name:'Baseline CNN',    acc:78.49, color:'#4f6ef7', desc:'Custom 4-layer CNN trained from scratch. Establishes baseline against which transfer learning gains are measured.', params:'~2.1M', type:'From Scratch', icon:'B' },
  { name:'Wavelet CNN',     acc:83.35, color:'#8b5cf6', desc:'Haar wavelet decomposition with 12-channel input. Captures frequency-domain generative artifacts absent in spatial analysis.', params:'~8.4M', type:'From Scratch', icon:'W' },
  { name:'EfficientNet-B3', acc:90.87, color:'#0ea5a0', desc:'ImageNet-pretrained with compound coefficient scaling. Efficiently balances network depth, width, and resolution.', params:'~12M', type:'Transfer Learning', icon:'E' },
  { name:'ResNet-50',       acc:91.37, color:'#f59e0b', desc:'ImageNet-pretrained with residual skip connections. Best-performing model across all evaluation metrics.', params:'~25M', type:'Transfer Learning', icon:'R', best:true },
]

const GENERALIZATION = [
  { label:'GenImage Test Set',    value:'91.37%',  sub:'Training distribution',     color:'#4f6ef7' },
  { label:'DALL-E 3 Detection',   value:'63.3%',   sub:'19/30 correctly detected',  color:'#e8704c' },
  { label:'Real iPhone Accuracy', value:'48.3%',   sub:'14/29 correctly classified',color:'#3B6D11' },
  { label:'Generalization Gap',   value:'-35.4pp', sub:'vs GenImage baseline',      color:'#A32D2D' },
]

const ABLATION = [
  { name:'Full Ensemble',         acc:55.9, drop:'—',      color:'#4f6ef7', baseline:true },
  { name:'Without ResNet-50',     acc:55.9, drop:'+0.0pp', color:'#3B6D11' },
  { name:'Without EfficientNet',  acc:55.9, drop:'+0.0pp', color:'#0ea5a0' },
  { name:'Without Wavelet CNN',   acc:50.8, drop:'-5.1pp', color:'#A32D2D' },
  { name:'Without Baseline CNN',  acc:50.8, drop:'-5.1pp', color:'#A32D2D' },
]

/* shared styles */
const card = { borderRadius:14, background:'#ffffff', border:'1px solid #E0D9D4' }

const TH = {
  fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
  fontFamily:'JetBrains Mono,monospace', color:'#888780',
  padding:'10px 14px', textAlign:'right',
  borderBottom:'1px solid #E0D9D4', whiteSpace:'nowrap',
  background:'#F5F1EE',
}
const TD  = { fontSize:12, fontFamily:'JetBrains Mono,monospace', color:'#5F5E5A', padding:'11px 14px', textAlign:'right', borderBottom:'1px solid #F0EBE8' }
const TDB = { ...TD, color:'#1a1a1a', fontWeight:700 }

function SectionDivider({ label, note }) {
  return (
    <div style={{ margin:'8px 0 4px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:10 }}>
        <div style={{ height:1, flex:1, background:'#E0D9D4' }} />
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'7px 18px', borderRadius:8,
          background:'#FEF4F4', border:'1px solid #F5C4C4',
        }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#e8704c' }} />
          <span className="mono" style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#e8704c' }}>
            {label}
          </span>
        </div>
        <div style={{ height:1, flex:1, background:'#E0D9D4' }} />
      </div>
      {note && (
        <p style={{ fontSize:12, color:'#888780', textAlign:'center', fontStyle:'italic', margin:'0 0 4px' }}>
          {note}
        </p>
      )}
    </div>
  )
}

export default function MetricsTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── Model Architecture Cards ── */}
      <div style={{ ...card, padding:'28px 32px' }}>
        <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#888780', marginBottom:4 }}>
          Model Architecture Overview
        </div>
        <p style={{ fontSize:13, color:'#5F5E5A', lineHeight:1.65, marginBottom:22, maxWidth:'48rem' }}>
          Accuracy progression across four architectures demonstrates performance gains from transfer learning relative to training from scratch on the GenImage benchmark.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {MODELS.map((m,i) => (
            <div key={i} style={{
              borderRadius:12, overflow:'hidden',
              border: m.best ? `1px solid ${m.color}60` : '1px solid #E0D9D4',
              background: m.best ? '#FFFDF5' : '#FAFAF9',
              transition:'transform 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <div style={{ height:3, background:m.color }} />
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:`${m.color}18`, border:`1px solid ${m.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:900, color:m.color, fontFamily:'JetBrains Mono,monospace' }}>{m.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:m.color, lineHeight:1.2 }}>{m.name}</div>
                      {m.best && (
                        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'JetBrains Mono,monospace', color:'#854F0B', background:'#FAEEDA', padding:'1px 5px', borderRadius:3 }}>
                          Best
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#1a1a1a', fontFamily:'JetBrains Mono,monospace', letterSpacing:'-0.03em' }}>{m.acc}%</div>
                </div>
                <div style={{ height:4, borderRadius:2, background:'#F0EBE8', marginBottom:12 }}>
                  <div className="progress-bar" style={{ height:4, borderRadius:2, background:m.color, width:`${m.acc}%` }} />
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                  <span style={{
                    fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                    fontFamily:'JetBrains Mono,monospace',
                    color: m.type==='Transfer Learning' ? '#3B6D11' : '#3C3489',
                    background: m.type==='Transfer Learning' ? '#EAF3DE' : '#EEEDFE',
                    padding:'2px 7px', borderRadius:4,
                  }}>
                    {m.type}
                  </span>
                  <span className="mono" style={{ fontSize:10, color:'#888780' }}>{m.params}</span>
                </div>
                <p style={{ fontSize:11, color:'#5F5E5A', lineHeight:1.55, margin:0 }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Evaluation Metrics Table ── */}
      <div style={{ ...card, overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #E0D9D4' }}>
          <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#888780', marginBottom:4 }}>
            Comprehensive Evaluation Metrics
          </div>
          <p style={{ fontSize:12, color:'#888780' }}>
            Test set · n = 1,994 samples · Balanced class distribution · GenImage benchmark
          </p>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Model','Accuracy','F1 Score','ROC-AUC','Prec (Real)','Rec (Real)','Prec (AI)','Rec (AI)','Errors','Error %'].map((h,i) => (
                  <th key={i} style={{ ...TH, textAlign:i===0?'left':'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m,i) => (
                <tr key={i} style={{ background: m.best ? '#FFFDF5' : i%2===0 ? '#FAFAF9' : '#ffffff' }}>
                  <td style={{ ...TD, textAlign:'left' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:m.color, flexShrink:0 }} />
                      <span style={{ fontWeight:600, color:m.color }}>{m.name}</span>
                      {m.best && (
                        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'JetBrains Mono,monospace', color:'#854F0B', background:'#FAEEDA', padding:'1px 6px', borderRadius:3 }}>Best</span>
                      )}
                    </div>
                  </td>
                  {[m.acc,m.f1,m.auc,m.pr,m.rr,m.pai,m.rai].map((v,j) => (
                    <td key={j} style={m.best && j<3 ? TDB : TD}>{v}</td>
                  ))}
                  <td style={{ ...TD, color:'#A32D2D' }}>{m.err}</td>
                  <td style={{ ...TD, color:'#A32D2D' }}>{m.epct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'10px 24px', borderTop:'1px solid #F0EBE8', background:'#F5F1EE' }}>
          <p className="mono" style={{ fontSize:11, color:'#888780' }}>
            F1 Score tracks closely with Accuracy across all models — confirming balanced class distribution and absence of majority-class bias.
          </p>
        </div>
      </div>

      {/* ── Robustness ── */}
      <div style={{ ...card, padding:'28px 32px' }}>
        <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#888780', marginBottom:4 }}>
          Robustness Evaluation — ResNet-50
        </div>
        <p style={{ fontSize:12, color:'#888780', marginBottom:22 }}>
          Degradation testing on 200 randomly sampled images per level. Baseline clean-image accuracy: 91.37%.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {ROBUST.map((r,i) => (
            <div key={i} style={{ borderRadius:12, padding:'18px', background:'#F5F1EE', border:'1px solid #E0D9D4' }}>
              <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#5F5E5A', marginBottom:14, lineHeight:1.4 }}>
                {r.label}
              </div>
              <div style={{ marginBottom:14, display:'flex', flexDirection:'column', gap:5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>
                  <span style={{ color:'#888780' }}>Best</span>
                  <span style={{ color:'#3B6D11', fontWeight:600 }}>{r.best}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>
                  <span style={{ color:'#888780' }}>Worst</span>
                  <span style={{ color:'#A32D2D', fontWeight:600 }}>{r.worst}</span>
                </div>
              </div>
              <div className="mono" style={{ fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.04em', color:r.color, marginBottom:7 }}>{r.drop}</div>
              <p style={{ fontSize:11, color:'#5F5E5A', lineHeight:1.55, margin:0 }}>{r.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase 5 Divider ── */}
      <SectionDivider
        label="Phase 5 — Extended Evaluation on Unseen Generators"
        note="Cross-generator generalization test conducted in response to evaluator feedback to strengthen robustness and evaluation depth."
      />

      {/* ── Generalization Results ── */}
      <div style={{ ...card, padding:'28px 32px', border:'1px solid #FACFB8', background:'#FFFAF7' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#888780' }}>
            Cross-Generator Generalization
          </div>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'JetBrains Mono,monospace', color:'#854F0B', background:'#FAEEDA', padding:'2px 8px', borderRadius:3 }}>
            New — Phase 5
          </span>
        </div>
        <p style={{ fontSize:13, color:'#5F5E5A', lineHeight:1.65, marginBottom:18, maxWidth:'44rem' }}>
          Ensemble evaluated on 30 DALL-E 3 images and 29 real iPhone photos — generators not present in the GenImage training distribution.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
          {GENERALIZATION.map((g,i) => (
            <div key={i} style={{ borderRadius:12, padding:'16px 18px', background:'#ffffff', border:`1px solid ${g.color}30`, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:g.color }} />
              <div className="mono" style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:'-0.04em', color:g.color, marginBottom:5 }}>{g.value}</div>
              <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#5F5E5A', marginBottom:2 }}>{g.label}</div>
              <div style={{ fontSize:11, color:'#888780' }}>{g.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { title:'DALL-E 3 Fooled the Model', color:'#e8704c', text:'DALL-E 3 images feature photorealistic faces, cinematic lighting, and organic textures that closely resemble professional photography — bypassing artifact detectors trained on older generator signatures.' },
            { title:'iPhone Computational Photography', color:'#A32D2D', text:'Modern iPhone Deep Fusion and HDR processing produces smooth, noise-free images that the model associates with AI generation — revealing that the training distribution does not account for computational photography.' },
          ].map((f,i) => (
            <div key={i} style={{ padding:'14px 16px', borderRadius:10, background:'#ffffff', borderLeft:`2px solid ${f.color}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:f.color, marginBottom:5 }}>{f.title}</div>
              <p style={{ fontSize:12, color:'#5F5E5A', lineHeight:1.65, margin:0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ablation Study ── */}
      <div style={{ ...card, padding:'28px 32px', border:'1px solid #FACFB8', background:'#FFFAF7' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#888780' }}>
            Ensemble Ablation Study
          </div>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'JetBrains Mono,monospace', color:'#854F0B', background:'#FAEEDA', padding:'2px 8px', borderRadius:3 }}>
            New — Phase 5
          </span>
        </div>
        <p style={{ fontSize:13, color:'#5F5E5A', lineHeight:1.65, marginBottom:18, maxWidth:'44rem' }}>
          Impact of removing each model from the ensemble vote on unseen generators (DALL-E 3 + iPhone). Full ensemble baseline: 55.9%.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:18 }}>
          {ABLATION.map((m,i) => (
            <div key={i} style={{ borderRadius:12, padding:'16px 18px', background:'#ffffff', border:`1px solid ${m.baseline?'#4f6ef780':'#E0D9D4'}`, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:m.color }} />
              <div className="mono" style={{ fontSize:'1.35rem', fontWeight:900, letterSpacing:'-0.03em', color:m.color, marginBottom:5 }}>{m.acc}%</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#2a2a2a', marginBottom:5, lineHeight:1.3 }}>{m.name}</div>
              <div className="mono" style={{ fontSize:11, color: m.drop.startsWith('-') ? '#A32D2D' : m.drop==='—' ? '#888780' : '#3B6D11', fontWeight:600 }}>{m.drop}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'12px 16px', borderRadius:10, background:'#F5F1EE', borderLeft:'2px solid #8C1D40' }}>
          <p style={{ fontSize:12, color:'#5F5E5A', lineHeight:1.7, margin:0 }}>
            Removing ResNet-50 or EfficientNet-B3 shows no accuracy drop on unseen data — both models make correlated errors on DALL-E 3.
            However, removing Wavelet CNN or Baseline CNN drops accuracy by 5.1pp back to random chance, confirming that prediction
            diversity from simpler architectures is the primary driver of ensemble generalization on out-of-distribution data.
          </p>
        </div>
      </div>

    </div>
  )
}