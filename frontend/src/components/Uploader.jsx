import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Uploader({ onResult, onFile, onLoading, loading }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview]   = useState(null)
  const [filename, setFilename] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const fileRef = useRef()

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setFilename(file.name)
    setFileSize((file.size / 1024).toFixed(0) + ' KB')
    setPreview(URL.createObjectURL(file))
    onFile(file); onResult(null); onLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await axios.post(`${API}/predict`, fd)
      onResult(data)
    } catch (e) {
      alert('Prediction failed. Ensure the backend is running on port 8000.')
    } finally {
      onLoading(false)
    }
  }, [onResult, onFile, onLoading])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontSize: 15, fontFamily: 'JetBrains Mono, monospace',
        color: 'maroon', letterSpacing: '0.18em',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        Image Input
      </div>

      {preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '16px 22px', borderRadius: 14, cursor: 'pointer',
            background: '#ffffff',
            border: `1px solid ${dragging ? '#8C1D40' : '#E0D9D4'}`,
            transition: 'border-color 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <input ref={fileRef} type="file" accept="image/*"
                 style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          <div className={loading ? 'scan-container' : ''}
               style={{ width: 220, height: 220, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #E0D9D4' }}>
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {loading && <div className="scan-line" />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#1a1a1a',
              marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {filename}
            </div>
            <div style={{
              fontSize: 11, color: '#888780', marginBottom: loading ? 10 : 0,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {fileSize}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {[0,1,2].map(i => (
                  <div key={i} className="pulse-dot" style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#8C1D40', animationDelay: `${i * 0.22}s`,
                  }} />
                ))}
                <span style={{ fontSize: 11, color: '#5F5E5A', fontFamily: 'JetBrains Mono, monospace' }}>
                  Running ensemble inference — 4 models · 6-pass TTA
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 11, color: '#B4B2A9', fontFamily: 'JetBrains Mono, monospace' }}>
                Click or drag to re-analyze
              </span>
            )}
          </div>

          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
            padding: '3px 10px', borderRadius: 4,
            ...(loading
              ? { background: '#EEEDFE', color: '#3C3489', border: '1px solid #AFA9EC' }
              : { background: '#EAF3DE', color: '#3B6D11', border: '1px solid #97C459' })
          }}>
            {loading ? 'Analyzing' : 'Complete'}
          </span>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          style={{
            borderRadius: 14, cursor: 'pointer',
            border: `1.5px dashed ${dragging ? '#8C1D40' : '#D4B8BE'}`,
            background: dragging ? '#FBF2F4' : '#FAFAF9',
            transition: 'all 0.2s ease',
            padding: '56px 32px',
            textAlign: 'center',
          }}
        >
          <input ref={fileRef} type="file" accept="image/*"
                 style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F5F1EE', border: '1px solid #E0D9D4',
            margin: '0 auto 16px',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v10M9 2L5.5 5.5M9 2l3.5 3.5"
                stroke="#8C1D40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 14v1.5h14V14"
                stroke="#D4B8BE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, color: '#2a2a2a', marginBottom: 6 }}>
            Upload an image for analysis
          </p>
          <p style={{ fontSize: 11, color: '#888780', fontFamily: 'JetBrains Mono, monospace', marginBottom: 20 }}>
            Drag and drop or click to browse
          </p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {['JPG', 'PNG', 'WebP', 'BMP'].map(fmt => (
              <span key={fmt} style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 4,
                background: '#F5F1EE', border: '1px solid #E0D9D4', color: '#888780',
              }}>
                {fmt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}