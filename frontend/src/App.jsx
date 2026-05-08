import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Uploader from './components/Uploader'
import ResultsTabs from './components/ResultsTabs'

export default function App() {
  const [result, setResult]   = useState(null)
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen relative" style={{ background: '#FAFAF9' }}>
      <div className="bg-grid" />
      <div className="bg-bloom-primary" />
      <div className="bg-bloom-accent" />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-8 pb-32">
          <Hero />
          <StatsBar />
          <Uploader
            onResult={setResult}
            onFile={setFile}
            onLoading={setLoading}
            loading={loading}
          />
          {(loading || result) && (
            <ResultsTabs result={result} file={file} loading={loading} />
          )}
        </main>
      </div>
    </div>
  )
}