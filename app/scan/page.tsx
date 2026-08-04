'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

interface ParagraphResult {
  text: string
  score: number
  index: number
  wordCount: number
}

interface ScanResults {
  overallScore: number
  paragraphs: ParagraphResult[]
}

type DetectionMode = 'openrouter' | 'heuristic' | 'hybrid'

const MIN_WORDS = 10
const SAMPLE_TEXT = `The rapid advancement of large language models has fundamentally changed how written content is produced. These systems generate coherent, contextually relevant text at scale, raising serious questions about authenticity in academic and professional settings.

Researchers have proposed numerous detection methodologies, ranging from perplexity analysis to watermarking schemes. However, detectors must continuously evolve to remain effective as generation techniques improve.`

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export default function ScanPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScanResults | null>(null)
  const [mode, setMode] = useState<DetectionMode>('openrouter')
  const [error, setError] = useState<string | null>(null)

  const wordCount = useMemo(() => countWords(text), [text])
  const canScan = !loading && wordCount >= MIN_WORDS

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setText(content)
        setResults(null)
        setError(null)
      }
    }
    reader.readAsText(file)
  }

  const handleScan = async () => {
    if (!canScan) return

    const rawParagraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (rawParagraphs.length === 0) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const payloadParagraphs = rawParagraphs.map((p, i) => ({
        index: i,
        text: p,
        wordCount: countWords(p),
      }))

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphs: payloadParagraphs, mode }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error ?? `Scan failed with status ${res.status}`)
      }

      if (Array.isArray(data)) {
        const parsedParagraphs: ParagraphResult[] = data.map((item: any, i: number) => ({
          text: item.text || rawParagraphs[i] || '',
          score: Math.round((item.aiProbability ?? 0) * 100),
          index: item.index ?? i,
          wordCount: item.wordCount || countWords(rawParagraphs[i] || ''),
        }))

        const totalScore = parsedParagraphs.reduce((acc, p) => acc + p.score, 0)
        const overallScore = parsedParagraphs.length > 0 ? Math.round(totalScore / parsedParagraphs.length) : 0

        setResults({
          overallScore,
          paragraphs: parsedParagraphs,
        })
      } else {
        throw new Error('Invalid response structure from backend')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze text.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/" className="text-link" style={{ fontSize: 14 }}>
            ← Home
          </Link>
          <h1 className="text-gradient" style={{ fontSize: 32, marginTop: 8 }}>
            AI Text Detector (GPTZero Style)
          </h1>
          <p className="text-secondary" style={{ marginTop: 4 }}>
            Paste text or upload a file to check for AI generation probability.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary btn-sm">
          Dashboard
        </Link>
      </header>

      <div className="glass-card animate-slide-up" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Controls bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            Upload File (.txt)
            <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setText(SAMPLE_TEXT)
              setResults(null)
              setError(null)
            }}
            disabled={loading}
          >
            Try Sample Text
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setText('')
              setResults(null)
              setError(null)
            }}
            disabled={loading || text.length === 0}
          >
            Clear
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }} className="text-secondary">
            <span>Mode:</span>
            <select
              className="form-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as DetectionMode)}
              style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: 13 }}
            >
              <option value="openrouter">OpenRouter AI</option>
              <option value="heuristic">Heuristic Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* Text Area */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            className="form-textarea"
            style={{
              minHeight: 260,
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
            placeholder="Paste your text here to analyze for AI-written content..."
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (results) setResults(null)
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            {wordCount} words | {text.length} characters
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={handleScan}
          disabled={!canScan}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" /> Analyzing Text...
            </span>
          ) : (
            'Scan Text for AI'
          )}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: 900, margin: '32px auto 0' }}>
          <h2 className="card-title" style={{ fontSize: 20, marginBottom: 20 }}>
            Scan Results
          </h2>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            <div className={`score-ring ${results.overallScore >= 50 ? 'score-ring-danger' : 'score-ring-success'}`} style={{ '--score': results.overallScore } as any}>
              <div className="score-ring-inner">
                <span className="score-ring-value">{results.overallScore}%</span>
                <span className="score-ring-label">AI Score</span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 22, marginBottom: 6 }}>
                {results.overallScore >= 50 ? 'Likely AI-Generated' : 'Likely Human-Written'}
              </h3>
              <p className="text-secondary" style={{ fontSize: 14 }}>
                Analyzed {results.paragraphs.length} paragraphs. High risk paragraphs are highlighted in red below.
              </p>
            </div>
          </div>

          {/* Paragraphs Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 className="text-secondary" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paragraph Breakdown
            </h4>
            {results.paragraphs.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: 'var(--bg-input)',
                  borderLeft: `4px solid ${p.score >= 50 ? 'var(--danger)' : 'var(--success)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span className={`badge ${p.score >= 50 ? 'badge-ai' : 'badge-human'}`}>
                    {p.score}% AI Probability
                  </span>
                  <span className="text-muted">{p.wordCount} words</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
