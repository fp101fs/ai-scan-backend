'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface ParagraphResult {
  text: string
  score: number
  index: number
  wordCount: number
  sentenceCount?: number
  perplexityScore?: number
  burstinessScore?: number
  vocabularyScore?: number
  method?: string
}

interface ScanResults {
  overallScore: number
  paragraphs: ParagraphResult[]
  avgPerplexity: number
  avgBurstiness: number
  avgVocabulary: number
  verdict: string
}

type DetectionMode = 'hybrid' | 'openrouter' | 'heuristic'

const MIN_WORDS = 8
const SAMPLE_TEXT = `The rapid advancement of large language models has fundamentally transformed artificial intelligence and computational linguistics. These systems generate highly coherent, contextually nuanced text across diverse domains. Furthermore, it is important to note that automated evaluation metrics have become paramount in determining document provenance and authenticity.

In contrast, human writers frequently exhibit spontaneous syntactic variations. We drop fragments. We change cadence abruptly! A short burst of thought is often immediately succeeded by an elaborate, multifaceted disquisition that twists grammatical conventions to convey idiosyncratic human emotion.`

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export default function ScanPage() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScanResults | null>(null)
  const [mode, setMode] = useState<DetectionMode>('hybrid')
  const [model, setModel] = useState<string>('openai/gpt-4o-mini')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
      .split(/\n\s*\n/)
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
        body: JSON.stringify({ paragraphs: payloadParagraphs, mode, model }),
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
          sentenceCount: item.sentenceCount,
          perplexityScore: item.perplexityScore ?? 50,
          burstinessScore: item.burstinessScore ?? 50,
          vocabularyScore: item.vocabularyScore ?? 50,
          method: item.method || mode,
        }))

        const totalScore = parsedParagraphs.reduce((acc, p) => acc + p.score, 0)
        const overallScore = parsedParagraphs.length > 0 ? Math.round(totalScore / parsedParagraphs.length) : 0

        const avgPerp = Math.round(
          parsedParagraphs.reduce((acc, p) => acc + (p.perplexityScore || 0), 0) / (parsedParagraphs.length || 1)
        )
        const avgBurst = Math.round(
          parsedParagraphs.reduce((acc, p) => acc + (p.burstinessScore || 0), 0) / (parsedParagraphs.length || 1)
        )
        const avgVocab = Math.round(
          parsedParagraphs.reduce((acc, p) => acc + (p.vocabularyScore || 0), 0) / (parsedParagraphs.length || 1)
        )

        let verdict = 'Likely Human-Written'
        if (overallScore >= 70) {
          verdict = 'Entirely AI-Generated'
        } else if (overallScore >= 45) {
          verdict = 'Mixed / AI-Assisted Content'
        }

        setResults({
          overallScore,
          paragraphs: parsedParagraphs,
          avgPerplexity: avgPerp,
          avgBurstiness: avgBurst,
          avgVocabulary: avgVocab,
          verdict,
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

  const handleCopyReport = () => {
    if (!results) return
    const report = `AI Scan Analysis Report\nOverall AI Score: ${results.overallScore}%\nVerdict: ${results.verdict}\nMode: ${mode}\nAnalyzed Paragraphs: ${results.paragraphs.length}\nPerplexity Index: ${results.avgPerplexity} | Burstiness: ${results.avgBurstiness} | Vocabulary Diversity: ${results.avgVocabulary}%\n\nParagraph Details:\n` +
      results.paragraphs.map((p, idx) => `[Paragraph ${idx + 1} - ${p.score}% AI]: "${p.text.slice(0, 100)}..."`).join('\n')

    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/" className="text-link" style={{ fontSize: 14 }}>
            ← Back to Home
          </Link>
          <h1 className="text-gradient" style={{ fontSize: 32, marginTop: 8 }}>
            AI Text Detector & Stylometrics
          </h1>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: 15 }}>
            Analyze text using OpenRouter LLMs and statistical Perplexity / Burstiness metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {session?.user ? (
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/api/auth/openrouter/login" className="btn btn-primary btn-sm">
              Connect OpenRouter (BYOK)
            </Link>
          )}
        </div>
      </header>

      {/* Main Scanner Card */}
      <div className="glass-card animate-slide-up" style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Controls bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            📁 Upload File (.txt, .md)
            <input type="file" accept=".txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
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
            ⚡ Try Sample Text
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

          {/* Mode Selector */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-secondary" style={{ fontSize: 13 }}>Mode:</span>
              <select
                className="form-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as DetectionMode)}
                style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: 13 }}
              >
                <option value="hybrid">✨ Hybrid (AI + Heuristic)</option>
                <option value="openrouter">🤖 OpenRouter AI</option>
                <option value="heuristic">⚡ Offline Heuristics (Free)</option>
              </select>
            </div>

            {mode !== 'heuristic' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="text-secondary" style={{ fontSize: 13 }}>Model:</span>
                <select
                  className="form-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: 13 }}
                >
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                  <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                  <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Text Area */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            className="form-textarea"
            style={{
              minHeight: 280,
              fontSize: 15,
              lineHeight: 1.65,
              fontFamily: 'inherit',
            }}
            placeholder="Paste your document, essay, or web article here to analyze for AI generation..."
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
            {wordCount} words | {text.length} chars
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 8,
              color: '#fca5a5',
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Scan Button */}
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={handleScan}
          disabled={!canScan}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span className="spinner" /> Analyzing Perplexity & Stylometrics...
            </span>
          ) : (
            `Analyze Content (${wordCount} Words)`
          )}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: 960, margin: '32px auto 0' }}>
          <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="card-title" style={{ fontSize: 24 }}>
                Analysis Breakdown
              </h2>
              <p className="text-secondary" style={{ fontSize: 14 }}>
                Evaluated {results.paragraphs.length} paragraph blocks across statistical and stylistic dimensions.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleCopyReport} className="btn btn-secondary btn-sm">
                {copied ? '✓ Report Copied' : '📋 Copy Summary'}
              </button>
            </div>
          </div>

          {/* Top Score Banner & Stylometric Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px',
                borderColor: results.overallScore >= 50 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                background: results.overallScore >= 50 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
              }}
            >
              <div
                className={`score-ring ${results.overallScore >= 50 ? 'score-ring-danger' : 'score-ring-success'}`}
                style={{ '--score': results.overallScore } as any}
              >
                <div className="score-ring-inner">
                  <span className="score-ring-value">{results.overallScore}%</span>
                  <span className="score-ring-label">AI Score</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 18, marginBottom: 4 }}>{results.verdict}</h3>
                <span className={`badge ${results.overallScore >= 50 ? 'badge-ai' : 'badge-human'}`}>
                  {results.overallScore >= 50 ? 'High Synthetic Markers' : 'Organic Human Stylometry'}
                </span>
              </div>
            </div>

            {/* Stylometric metric badges */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <p className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Burstiness Index
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {results.avgBurstiness} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 100</span>
              </p>
              <p className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                {results.avgBurstiness < 35 ? 'Low variance (AI signature)' : 'High sentence rhythm variation'}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <p className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vocabulary Diversity
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {results.avgVocabulary}% <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>TTR</span>
              </p>
              <p className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                Unique token density across body
              </p>
            </div>
          </div>

          {/* Paragraphs Breakdown */}
          <div>
            <h3 className="text-secondary" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Paragraph Heatmap Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 18,
                    borderRadius: 12,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderLeft: `5px solid ${p.score >= 50 ? 'var(--danger)' : 'var(--success)'}`,
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${p.score >= 50 ? 'badge-ai' : 'badge-human'}`}>
                        {p.score}% AI Probability
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                        {p.method}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{p.wordCount} words</span>
                      {p.sentenceCount ? <span>{p.sentenceCount} sentences</span> : null}
                      {p.burstinessScore ? <span>Burst: {p.burstinessScore}</span> : null}
                    </div>
                  </div>

                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#f1f5f9' }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
