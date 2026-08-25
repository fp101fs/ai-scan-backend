'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'

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
  sentences?: {
    text: string
    score: number
    wordCount: number
    isAiLikely: boolean
  }[]
}

interface ScanResults {
  overallScore: number
  humanScore: number
  paragraphs: ParagraphResult[]
  allSentences: {
    text: string
    score: number
    wordCount: number
    isAiLikely: boolean
    paragraphIndex: number
  }[]
  avgPerplexity: number
  avgBurstiness: number
  avgVocabulary: number
  aiPhraseCount: number
  verdict: string
}

type DetectionMode = 'hybrid' | 'openrouter' | 'heuristic'
type ActiveTab = 'document' | 'paragraphs' | 'stylometrics'

const MIN_WORDS = 8
const SAMPLE_TEXT = `The rapid advancement of large language models represents a pivotal milestone in the evolution of modern artificial intelligence. These computational architectures seamlessly process vast quantities of textual data to generate contextually relevant outputs. Furthermore, it is important to note that automated evaluation metrics play a crucial role in modern productivity workflows. In conclusion, the integration of intelligent automation stands as a testament to human ingenuity in an increasingly digital landscape.

In contrast, my grandfather never threw away anything that had a screw or a hinge. His garage smelled permanently of WD-40, stale pipe tobacco, and sawdust. If a toaster stopped working, he didn't buy a new one; he took it apart on the workbench, spread out all thirty pieces on an old kitchen towel, and muttered until he found the loose wire. Sometimes it took three weeks. Sometimes it never toasted evenly again, but that wasn't the point.`

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('document')
  const [hoveredSentence, setHoveredSentence] = useState<number | null>(null)
  const [selectedSentence, setSelectedSentence] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const wordCount = useMemo(() => countWords(text), [text])
  const charCount = text.length
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

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText) {
        setText(clipboardText)
        setResults(null)
        setError(null)
      }
    } catch {
      // Clipboard permissions
    }
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
    setSelectedSentence(null)
    setHoveredSentence(null)

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
        let allSentencesList: ScanResults['allSentences'] = []
        let totalAiPhrases = 0

        const parsedParagraphs: ParagraphResult[] = data.map((item: any, i: number) => {
          const paraText = item.text || rawParagraphs[i] || ''
          const paraScore = Math.round((item.aiProbability ?? 0) * 100)
          
          const rawSents = paraText.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).filter(Boolean)
          const sents = rawSents.length > 0 ? rawSents : [paraText]

          const parsedSents = sents.map((sText) => {
            const sWords = countWords(sText)
            const hasAiCliché = /furthermore|moreover|in conclusion|it is important to note|delve|testament to|tapestry|seamlessly/i.test(sText)
            let sScore = paraScore
            if (hasAiCliché) {
              sScore = Math.min(100, Math.max(85, paraScore + 20))
              totalAiPhrases += 1
            } else if (sWords > 25 && paraScore < 30) {
              sScore = Math.max(0, paraScore - 10)
            }

            const sentObj = {
              text: sText,
              score: sScore,
              wordCount: sWords,
              isAiLikely: sScore >= 50,
              paragraphIndex: i,
            }
            allSentencesList.push(sentObj)
            return sentObj
          })

          return {
            text: paraText,
            score: paraScore,
            index: item.index ?? i,
            wordCount: item.wordCount || countWords(paraText),
            sentenceCount: item.sentenceCount || sents.length,
            perplexityScore: item.perplexityScore ?? 50,
            burstinessScore: item.burstinessScore ?? 50,
            vocabularyScore: item.vocabularyScore ?? 50,
            method: item.method || mode,
            sentences: parsedSents,
          }
        })

        const totalScore = parsedParagraphs.reduce((acc, p) => acc + p.score, 0)
        const overallScore = parsedParagraphs.length > 0 ? Math.round(totalScore / parsedParagraphs.length) : 0
        const humanScore = 100 - overallScore

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
          verdict = 'Your text is likely entirely AI-generated'
        } else if (overallScore >= 45) {
          verdict = 'Your text contains mixed AI & human content'
        } else {
          verdict = 'Your text is likely written by a human'
        }

        setResults({
          overallScore,
          humanScore,
          paragraphs: parsedParagraphs,
          allSentences: allSentencesList,
          avgPerplexity: avgPerp,
          avgBurstiness: avgBurst,
          avgVocabulary: avgVocab,
          aiPhraseCount: totalAiPhrases,
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
    const report = `AI Scan Analysis Report (GPTZero + ZeroGPT Hybrid)\n=====================================\nOverall AI Probability : ${results.overallScore}%\nHuman Probability      : ${results.humanScore}%\nVerdict                : ${results.verdict}\nEngine Mode            : ${mode}\nAnalyzed Sentences     : ${results.allSentences.length}\nAnalyzed Paragraphs    : ${results.paragraphs.length}\nPerplexity Index       : ${results.avgPerplexity} / 100\nBurstiness Variance    : ${results.avgBurstiness} / 100\nVocabulary Diversity   : ${results.avgVocabulary}% TTR\n\nSentence Breakdown:\n` +
      results.allSentences.map((s) => `[${s.score >= 50 ? 'AI-LIKELY' : 'HUMAN'}] (${s.score}% AI): "${s.text}"`).join('\n')

    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/" className="text-link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            &larr; Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <h1 className="text-gradient" style={{ fontSize: 30, margin: 0 }}>
              AI Text Detector
            </h1>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>GPTZero + ZeroGPT Hybrid</span>
          </div>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: 14 }}>
            Multi-model perplexity combined with ZeroGPT-style multi-scale burstiness and sentence highlighting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/comparison" className="btn btn-secondary btn-sm">
            Comparison vs GPTZero
          </Link>
          <ThemeToggle />
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

      {/* Main Scanner Box */}
      <div className="glass-card animate-slide-up" style={{ maxWidth: 1020, margin: '0 auto' }}>
        {/* Top Action Bar (ZeroGPT style quick controls) */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePaste}
            disabled={loading}
          >
            📋 Paste Text
          </button>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            📁 Upload (.txt, .md)
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
            ⚡ Try Sample
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

          {/* Engine & Model Selector (GPTZero style) */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-secondary" style={{ fontSize: 13 }}>Engine:</span>
              <select
                className="form-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as DetectionMode)}
                style={{ width: 'auto', padding: '5px 28px 5px 10px', fontSize: 13 }}
              >
                <option value="hybrid">✨ Hybrid (Recommended: AI + Stylometrics)</option>
                <option value="heuristic">⚡ ZeroGPT-Style Heuristics (Free/Fast)</option>
                <option value="openrouter">🤖 GPTZero-Style Multi-Model AI</option>
              </select>
            </div>

            {mode !== 'heuristic' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="text-secondary" style={{ fontSize: 13 }}>Model:</span>
                <select
                  className="form-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ width: 'auto', padding: '5px 28px 5px 10px', fontSize: 13 }}
                >
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                  <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Text Area with Live Counters */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            className="form-textarea"
            style={{
              minHeight: 240,
              fontSize: 15,
              lineHeight: 1.65,
              fontFamily: 'inherit',
              paddingBottom: 40,
            }}
            placeholder="Paste your text or essay here (minimum 8 words) to check for AI-written content..."
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
              left: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            <span>
              {wordCount < MIN_WORDS ? `Need ${MIN_WORDS - wordCount} more words` : '✓ Ready to scan'}
            </span>
            <span>
              <strong>{wordCount}</strong> words | <strong>{charCount}</strong> characters
            </span>
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

        {/* Detect Button */}
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={handleScan}
          disabled={!canScan}
          style={{ fontSize: 16, fontWeight: 700, padding: '14px 24px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <span className="spinner" /> Analyzing Perplexity & Multi-Scale Burstiness...
            </span>
          ) : (
            `⚡ Detect AI Content (${wordCount} Words)`
          )}
        </button>
      </div>

      {/* RESULTS DISPLAY (GPTZero + ZeroGPT Hybrid Dashboard) */}
      {results && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: 1020, margin: '32px auto 0', padding: '32px' }}>
          
          {/* Top Score Banner (ZeroGPT Radial Dial + GPTZero Verdict) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 28,
              paddingBottom: 28,
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Animated Conic Radial Score Ring */}
              <div
                className={`score-ring score-ring-lg ${
                  results.overallScore >= 60 ? 'score-ring-danger' : results.overallScore >= 35 ? '' : 'score-ring-success'
                }`}
                style={{ '--score': results.overallScore } as any}
              >
                <div className="score-ring-inner">
                  <span className="score-ring-value" style={{ fontSize: 34 }}>{results.overallScore}%</span>
                  <span className="score-ring-label">AI Score</span>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: '#f8fafc' }}>
                  {results.verdict}
                </h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge ${results.overallScore >= 50 ? 'badge-ai' : 'badge-human'}`}>
                    {results.overallScore}% AI Probability
                  </span>
                  <span className="badge badge-human">
                    {results.humanScore}% Human Probability
                  </span>
                  <span className="badge badge-neutral">
                    {results.allSentences.length} Sentences Analyzed
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={handleCopyReport} className="btn btn-secondary btn-sm">
                {copied ? '✓ Copied' : '📋 Copy Report'}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (ZeroGPT + GPTZero Stylometrics) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              margin: '24px 0',
            }}
          >
            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <p className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sentence Burstiness
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {results.avgBurstiness} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
              </p>
              <div className="gauge-track" style={{ marginTop: 6 }}>
                <div
                  className="gauge-fill"
                  style={{
                    width: `${results.avgBurstiness}%`,
                    background: results.avgBurstiness < 40 ? 'var(--danger)' : 'var(--success)',
                  }}
                />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <p className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Perplexity Score
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {results.avgPerplexity} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
              </p>
              <div className="gauge-track" style={{ marginTop: 6 }}>
                <div
                  className="gauge-fill"
                  style={{
                    width: `${results.avgPerplexity}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <p className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vocabulary Diversity
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {results.avgVocabulary}% <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TTR</span>
              </p>
              <div className="gauge-track" style={{ marginTop: 6 }}>
                <div
                  className="gauge-fill"
                  style={{
                    width: `${results.avgVocabulary}%`,
                    background: results.avgVocabulary < 50 ? 'var(--warning)' : 'var(--success)',
                  }}
                />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <p className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Cliché Markers
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {results.aiPhraseCount} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Detected</span>
              </p>
              <p className="text-secondary" style={{ fontSize: 11, marginTop: 4 }}>
                Formulaic AI transition patterns
              </p>
            </div>
          </div>

          {/* TAB NAVIGATION (Document View vs Paragraphs vs Stylometrics) */}
          <div className="tab-container">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'document' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('document')}
            >
              📝 Interactive Document View (Highlighted Sentences)
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'paragraphs' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('paragraphs')}
            >
              📊 Paragraph Breakdown ({results.paragraphs.length})
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'stylometrics' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('stylometrics')}
            >
              🔬 Stylometrics & Deep Dive
            </button>
          </div>

          {/* TAB 1: INTERACTIVE DOCUMENT VIEW WITH INLINE SENTENCE HIGHLIGHTS */}
          {activeTab === 'document' && (
            <div className="animate-fade-in">
              {/* Highlight Legend */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  marginBottom: 16,
                  padding: '10px 16px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  flexWrap: 'wrap',
                }}
              >
                <span className="text-secondary">Highlight Legend:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }} />
                  <strong style={{ color: '#fca5a5' }}>AI-Generated (&gt; 50%)</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }} />
                  <strong style={{ color: '#fcd34d' }}>Mixed / Moderate (30-50%)</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e' }} />
                  <strong style={{ color: '#86efac' }}>Human-Written (&lt; 30%)</strong>
                </span>
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
                  Hover or click any sentence to inspect individual score
                </span>
              </div>

              {/* Document Text Box */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  background: 'rgba(10, 10, 26, 0.7)',
                  fontSize: 16,
                  lineHeight: 1.8,
                }}
              >
                {results.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} style={{ marginBottom: pIdx < results.paragraphs.length - 1 ? '1.5em' : 0 }}>
                    {p.sentences?.map((s, sIdx) => {
                      const globalIdx = results.allSentences.findIndex((item) => item.text === s.text)
                      const isHovered = hoveredSentence === globalIdx
                      const isSelected = selectedSentence === globalIdx
                      const highlightClass =
                        s.score >= 50
                          ? 'sentence-highlight-ai'
                          : s.score >= 30
                          ? 'sentence-highlight-mixed'
                          : 'sentence-highlight-human'

                      return (
                        <span
                          key={sIdx}
                          className={`sentence-hoverable ${highlightClass}`}
                          style={{
                            outline: isSelected ? '2px solid var(--accent)' : 'none',
                            fontWeight: isHovered || isSelected ? 600 : 'normal',
                          }}
                          onMouseEnter={() => setHoveredSentence(globalIdx)}
                          onMouseLeave={() => setHoveredSentence(null)}
                          onClick={() => setSelectedSentence(selectedSentence === globalIdx ? null : globalIdx)}
                          title={`Sentence AI Score: ${s.score}% (${s.wordCount} words)`}
                        >
                          {s.text}{' '}
                        </span>
                      )
                    })}
                  </p>
                ))}
              </div>

              {/* Selected / Hovered Sentence Inspector Card */}
              {(selectedSentence !== null || hoveredSentence !== null) && (
                <div
                  className="glass-card animate-slide-up"
                  style={{
                    marginTop: 16,
                    padding: '16px 20px',
                    borderColor: 'var(--accent)',
                    background: 'rgba(99, 102, 241, 0.08)',
                  }}
                >
                  {(() => {
                    const activeSentIdx = selectedSentence !== null ? selectedSentence : hoveredSentence
                    const activeSent = results.allSentences[activeSentIdx!]
                    if (!activeSent) return null

                    return (
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                            <span className={`badge ${activeSent.score >= 50 ? 'badge-ai' : 'badge-human'}`}>
                              {activeSent.score}% AI Likelihood
                            </span>
                            <span className="text-muted" style={{ fontSize: 12 }}>
                              Sentence #{activeSentIdx! + 1} · {activeSent.wordCount} words
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: '#f1f5f9', fontStyle: 'italic' }}>
                            &ldquo;{activeSent.text}&rdquo;
                          </p>
                        </div>
                        <span className="text-secondary" style={{ fontSize: 12 }}>
                          {activeSent.score >= 50 ? '⚠️ High probability of synthetic generation' : '✓ Natural human cadence & vocabulary'}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARAGRAPH-BY-PARAGRAPH BREAKDOWN (GPTZero Style) */}
          {activeTab === 'paragraphs' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderLeft: `5px solid ${p.score >= 50 ? 'var(--danger)' : 'var(--success)'}`,
                    background: 'var(--bg-input)',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${p.score >= 50 ? 'badge-ai' : 'badge-human'}`}>
                        Paragraph {idx + 1} : {p.score}% AI
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                        {p.method}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{p.wordCount} words</span>
                      <span>{p.sentenceCount} sentences</span>
                      <span>Perplexity: {p.perplexityScore}</span>
                      <span>Burstiness: {p.burstinessScore}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#f1f5f9' }}>{p.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STYLOMETRIC DEEP DIVE (ZeroGPT + GPTZero Metrics) */}
          {activeTab === 'stylometrics' && (
            <div className="animate-fade-in">
              <div className="card-grid-2" style={{ marginBottom: 20 }}>
                <div className="glass-card">
                  <h3 className="card-title" style={{ fontSize: 17, marginBottom: 12 }}>
                    📐 Sentence Burstiness Distribution
                  </h3>
                  <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    Calculates variance vs mean across sentence and clause lengths (Burstiness = (std - mean) / (std + mean)). Low variance indicates synthetic machine generation.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span>Burstiness Index</span>
                    <strong>{results.avgBurstiness} / 100</strong>
                  </div>
                  <div className="gauge-track">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${results.avgBurstiness}%`,
                        background: results.avgBurstiness < 40 ? 'var(--danger)' : 'var(--success)',
                      }}
                    />
                  </div>
                </div>

                <div className="glass-card">
                  <h3 className="card-title" style={{ fontSize: 17, marginBottom: 12 }}>
                    🔤 Lexical Entropy & Type-Token Ratio
                  </h3>
                  <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    Measures the ratio of unique words to total words (TTR = unique / total). AI texts frequently reuse narrow vocabulary clusters.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span>Type-Token Ratio</span>
                    <strong>{results.avgVocabulary}%</strong>
                  </div>
                  <div className="gauge-track">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${results.avgVocabulary}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <h3 className="card-title" style={{ fontSize: 17, marginBottom: 12 }}>
                  🔍 Formulaic AI Transition Clichés
                </h3>
                <p className="text-secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Detected <strong>{results.aiPhraseCount}</strong> characteristic connective phrases commonly generated by language models (e.g. <em>furthermore</em>, <em>moreover</em>, <em>in conclusion</em>, <em>testament to</em>, <em>tapestry</em>).
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {results.aiPhraseCount > 0 ? (
                    <span className="badge badge-ai">Synthetic Transition Markers Present</span>
                  ) : (
                    <span className="badge badge-human">No Formulaic Clichés Flagged</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
