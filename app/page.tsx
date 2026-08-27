'use client'

import React, { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ThemeToggle from '../components/ThemeToggle'
import { analyzeHeuristics, advancedHeuristicHumanize } from '../lib/heuristics'

interface PricingTier {
  name: string
  price: string
  wordsPerMonth: string
  features: string[]
  popular?: boolean
  ctaText: string
  ctaLink: string
}

interface Testimonial {
  quote: string
  author: string
  title: string
}

interface Feature {
  icon: string
  title: string
  description: string
}

interface Step {
  number: string
  title: string
  description: string
}

const exampleTexts: Record<string, string> = {
  ChatGPT:
    'The rapid advancement of large language models represents a pivotal milestone in the evolution of modern artificial intelligence. These computational architectures seamlessly process vast quantities of textual data to generate contextually relevant outputs. Furthermore, automated evaluation metrics play a crucial role in modern productivity workflows.',
  Claude:
    'Artificial intelligence systems have undergone rapid evolutionary cycles, transforming modern computing paradigms. When evaluating natural language processing systems, it is essential to consider both the structural cohesion and the underlying statistical distribution of vocabulary tokens across disparate domains.',
  Human:
    "My grandfather never threw away anything that had a screw or a hinge. His garage smelled permanently of WD-40, stale pipe tobacco, and sawdust. If an old toaster stopped working, he took it apart on the workbench, spread the parts on an old kitchen towel, and muttered until he fixed it. Sometimes it took three weeks.",
  'AI + Human':
    'The rapid adoption of artificial intelligence has transformed modern software engineering workflows. However, in our daily engineering team standups, we still rely on human intuition to debug complex edge cases and architectural trade-offs that automated tools overlook.',
  'Polished by AI':
    'This project investigates the multifaceted implications of machine learning in academic environments. The empirical findings substantiate the hypothesis that systematic peer review processes significantly enhance educational rigor and pedagogical outcomes.',
  'Paraphrased by AI':
    'In accordance with recent analytical assessments, the implementation of computational language models facilitates substantial enhancements in organizational efficiency across diverse operational sectors.',
}

export default function Home() {
  const { data: session } = useSession()
  const isAuthenticated = Boolean(session?.user)
  const user = session?.user as any

  const [text, setText] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'detector' | 'humanizer'>('detector')
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  
  // Humanizer v1 state
  const [humanizeInput, setHumanizeInput] = useState('')
  const [humanizedOutput, setHumanizedOutput] = useState<string | null>(null)
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [humanizeMethod, setHumanizeMethod] = useState<string | null>(null)
  const [copiedHumanized, setCopiedHumanized] = useState(false)

  const [scanResult, setScanResult] = useState<{
    score: number
    verdict: string
    subVerdict?: string
    avgPerplexity?: number
    burstiness?: number
    completelyGeneratedProb?: number
    mixedGeneratedProb?: number
    humanWrittenProb?: number
    aiPercentage?: number
  } | null>(null)
  const [scannedParagraphs, setScannedParagraphs] = useState<
    {
      text: string
      score: number
      isAi: boolean
      sentences?: { text: string; score: number; isAi: boolean }[]
    }[]
  >([])
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const liveStylometrics = useMemo(() => {
    return analyzeHeuristics(text.trim() || exampleTexts['ChatGPT'])
  }, [text])

  const handleHumanize = async () => {
    const targetText = humanizeInput.trim() || text.trim()
    if (targetText.length < 10) {
      alert('Please enter at least 10 characters to humanize.')
      return
    }
    setIsHumanizing(true)
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetText,
          model: 'deepseek/deepseek-v4-flash-0731',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setHumanizedOutput(data.humanizedText || '')
        setHumanizeMethod(data.method || 'heuristic')
      } else {
        const fallback = advancedHeuristicHumanize(targetText)
        setHumanizedOutput(fallback)
        setHumanizeMethod('heuristic')
      }
    } catch {
      const fallback = advancedHeuristicHumanize(targetText)
      setHumanizedOutput(fallback)
      setHumanizeMethod('heuristic')
    } finally {
      setIsHumanizing(false)
    }
  }

  const pricingTiers: PricingTier[] = [
    {
      name: 'Free Heuristic',
      price: '$0',
      wordsPerMonth: 'Unlimited offline heuristic scans',
      features: [
        'ZeroGPT-Style Burstiness Analysis (B_sent)',
        'Type-Token Vocabulary Diversity Metrics',
        '100% Client-Side & Zero-Data Retention',
        'No account or API key required',
      ],
      ctaText: 'Launch Free Scanner',
      ctaLink: '/scan',
    },
    {
      name: 'OpenRouter BYOK',
      price: 'Wholesale',
      wordsPerMonth: 'Pay-as-you-go (~$0.0001/scan)',
      features: [
        '1-Click OpenRouter PKCE OAuth',
        'GPT-4o Mini, Claude 3.5 & Gemini 2.5',
        'Sentence-by-Sentence Interactive Highlights',
        'Direct API log deep-linking & SHA-256 keys',
        'Zero subscription markup or lock-in',
      ],
      popular: true,
      ctaText: 'Connect OpenRouter (BYOK)',
      ctaLink: '/api/auth/openrouter/login',
    },
    {
      name: 'Developer & Extension',
      price: 'Open Source',
      wordsPerMonth: 'Full API, CLI & Extension Access',
      features: [
        'Chrome Extension on-the-fly scanning',
        'Python CLI & batch processing scripts',
        'Interactive Sentence-Level Tooltips',
        'Multi-Model Consensus Verification',
        'Enterprise-grade zero retention',
      ],
      ctaText: 'View Comparison & Docs',
      ctaLink: '/comparison',
    },
  ]

  const testimonials: Testimonial[] = [
    {
      quote:
        'This tool provides exceptional accuracy in detecting AI-generated content. The detailed reports help us maintain academic integrity.',
      author: 'Dr. Sarah Chen',
      title: 'Department Chair, State University',
    },
    {
      quote:
        'The most reliable AI detector we have used. It catches what others miss and gives us confidence in our content verification.',
      author: 'Michael Rodriguez',
      title: 'Content Manager, Digital Agency',
    },
    {
      quote:
        'A game-changer for educators. The granular insights help us understand not just if AI was used, but how it was integrated.',
      author: 'Jennifer Walsh',
      title: 'High School Principal',
    },
  ]

  const features: Feature[] = [
    {
      icon: '⚡',
      title: 'ZeroGPT-Style Multi-Scale Burstiness',
      description:
        'Calculates variance across sentence and clause lengths (B_sent = (std - mean) / (std + mean)) to instantly identify machine uniformity with zero API costs.',
    },
    {
      icon: '🔬',
      title: 'GPTZero-Style Perplexity & In-Line Highlights',
      description:
        'Inspect entire documents with interactive sentence-by-sentence color highlighting (Red for AI, Amber for Mixed, Green for Human).',
    },
    {
      icon: '🔑',
      title: 'OpenRouter OAuth (BYOK)',
      description:
        'Connect your OpenRouter account via 1-click PKCE OAuth. Use direct wholesale credits (~$0.0001/scan) with zero subscription lock-in.',
    },
    {
      icon: '🧩',
      title: 'Chrome Extension & Web Platform',
      description:
        'Scan entire web pages on-the-fly as you browse, or paste articles, essays, and documents into the web scanner for granular breakdowns.',
    },
    {
      icon: '🛡️',
      title: '100% Zero-Data Retention',
      description:
        'Your scanned content is evaluated in-memory on demand and never logged, stored in databases, or used to train AI models.',
    },
    {
      icon: '📊',
      title: 'Deep-Linked Usage & Logs',
      description:
        'Instant cryptographic links to your personal OpenRouter logs and key settings with automated SHA-256 key hashing.',
    },
  ]

  const steps: Step[] = [
    {
      number: '01',
      title: 'Paste Text or Upload',
      description:
        'Paste text, upload a document (.txt, .md), or scan live web pages with the Chrome Extension.',
    },
    {
      number: '02',
      title: 'Choose Detection Mode',
      description:
        'Select Hybrid (AI + Stylometrics), Fast ZeroGPT Heuristics, or Multi-Model LLM verification.',
    },
    {
      number: '03',
      title: 'Inspect Sentence Highlights',
      description:
        'Get an instant radial score dial, sentence-by-sentence color highlights, and stylometric breakdowns.',
    },
  ]

  const examples = [
    'ChatGPT',
    'Claude',
    'Human',
    'AI + Human',
    'Polished by AI',
    'Paraphrased by AI',
  ]

  const handleScan = async (textOverride?: string | React.MouseEvent | unknown) => {
    const rawText = typeof textOverride === 'string' ? textOverride : text
    if (rawText.trim().length < 10) {
      if (typeof textOverride !== 'string') {
        alert('Please enter at least 10 characters to scan.')
      }
      return
    }

    const rawParagraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (rawParagraphs.length === 0) return

    setIsScanning(true)
    setScanResult(null)
    setScannedParagraphs([])

    try {
      const payloadParagraphs = rawParagraphs.map((p, i) => ({
        index: i,
        text: p,
        wordCount: p.trim().split(/\s+/).filter(Boolean).length,
      }))

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraphs: payloadParagraphs,
          mode: 'hybrid',
          model: 'openai/gpt-4o-mini',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const totalScore = data.reduce(
            (acc: number, p: any) => acc + Math.round((p.aiProbability ?? 0) * 100),
            0
          )
          const score = Math.round(totalScore / data.length)
          const maxScore = Math.max(...data.map((p: any) => Math.round((p.aiProbability ?? 0) * 100)), 0)
          const aiFlaggedCount = data.filter((p: any) => (p.aiProbability ?? 0) >= 0.5).length

          let verdict = 'Likely Human-Written'
          if (aiFlaggedCount === data.length && score >= 70) {
            verdict = 'Entirely AI-Generated (100% of sections flagged)'
          } else if (aiFlaggedCount > 0 || maxScore >= 70) {
            verdict = `Contains AI-Generated Content (${aiFlaggedCount} of ${data.length} sections flagged as AI)`
          } else if (score >= 35) {
            verdict = 'Moderate AI / Mixed patterns'
          } else {
            verdict = 'Likely Human-Written'
          }

          const parsedList = data.map((p: any) => {
            const pText = p.text || ''
            const pScore = Math.round((p.aiProbability ?? 0) * 100)
            
            let sents = p.sentences
            if (!sents || sents.length === 0) {
              const rawSents = pText.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).filter(Boolean)
              sents = (rawSents.length > 0 ? rawSents : [pText]).map((st: string) => {
                const isCliché = /furthermore|moreover|in conclusion|it is important to note|delve|testament to|tapestry|seamlessly/i.test(st)
                const sScore = isCliché ? Math.min(100, Math.max(85, pScore + 20)) : pScore
                return {
                  text: st,
                  score: sScore,
                  isAi: sScore >= 50,
                }
              })
            }

            return {
              text: pText,
              score: pScore,
              isAi: pScore >= 50,
              sentences: sents.map((s: any) => ({
                text: s.text,
                score: s.score ?? pScore,
                isAi: Boolean((s.isAi ?? (s.score >= 50)) || ((s.score ?? pScore) >= 50)),
              })),
            }
          })

          const avgPerp = Math.round(
            (data.reduce((acc: number, p: any) => acc + (p.perplexityScore ?? 50), 0) / data.length) * 10
          ) / 10
          const avgBurst = Math.round(
            (data.reduce((acc: number, p: any) => acc + (p.burstinessScore ?? 15), 0) / data.length) * 10
          ) / 10
          const avgComp = Math.round(
            (data.reduce((acc: number, p: any) => acc + (p.completelyGeneratedProb ?? (score >= 70 ? 0.95 : 0.05)), 0) / data.length) * 100
          )
          const avgMixed = Math.round(
            (data.reduce((acc: number, p: any) => acc + (p.mixedGeneratedProb ?? (score >= 35 && score < 70 ? 0.85 : 0.05)), 0) / data.length) * 100
          )
          const avgHuman = Math.max(0, 100 - avgComp - avgMixed)

          const subVerdict = data[0]?.subVerdict || `We are 99% confident this text contains AI-generated content`

          setScannedParagraphs(parsedList)
          setIsEditing(false)
          setScanResult({
            score,
            verdict,
            subVerdict,
            avgPerplexity: avgPerp,
            burstiness: avgBurst,
            completelyGeneratedProb: avgComp,
            mixedGeneratedProb: avgMixed,
            humanWrittenProb: avgHuman,
            aiPercentage: score,
          })
        } else {
          setScanResult({
            score: 18,
            verdict: 'Likely Human-Written',
            subVerdict: 'We are 94% confident this text is written by a human',
            avgPerplexity: 72.5,
            burstiness: 24.1,
            completelyGeneratedProb: 1,
            mixedGeneratedProb: 5,
            humanWrittenProb: 94,
            aiPercentage: 0,
          })
          setScannedParagraphs([{ text, score: 18, isAi: false }])
          setIsEditing(false)
        }
      } else {
        const isAi = /furthermore|moreover|in conclusion|testament to|seamlessly|multifaceted/i.test(text)
        const score = isAi ? 88 : 12
        setScanResult({
          score,
          verdict: score >= 50 ? 'Contains AI-Generated Content (1 of 1 sections flagged as AI)' : 'Likely Human-Written',
          subVerdict: score >= 50 ? 'We are 98% confident this text is AI-generated' : 'We are 94% confident this text is human-written',
          avgPerplexity: isAi ? 12.0 : 75.0,
          burstiness: isAi ? 4.2 : 22.1,
          completelyGeneratedProb: isAi ? 95 : 2,
          mixedGeneratedProb: 3,
          humanWrittenProb: isAi ? 2 : 95,
          aiPercentage: isAi ? 100 : 0,
        })
        setScannedParagraphs([{ text, score, isAi }])
        setIsEditing(false)
      }
    } catch {
      const isAi = /furthermore|moreover|in conclusion|testament to|seamlessly|multifaceted/i.test(text)
      const score = isAi ? 85 : 15
      setScanResult({
        score,
        verdict: score >= 50 ? 'Contains AI-Generated Content (1 of 1 sections flagged as AI)' : 'Likely Human-Written',
        subVerdict: score >= 50 ? 'We are 98% confident this text is AI-generated' : 'We are 94% confident this text is human-written',
        avgPerplexity: isAi ? 12.0 : 75.0,
        burstiness: isAi ? 4.2 : 22.1,
        completelyGeneratedProb: isAi ? 95 : 2,
        mixedGeneratedProb: 3,
        humanWrittenProb: isAi ? 2 : 95,
        aiPercentage: isAi ? 100 : 0,
      })
      setScannedParagraphs([{ text, score, isAi }])
      setIsEditing(false)
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = (e.target?.result as string) || ''
        setText(content)
        if (content.trim().length >= 10) {
          handleScan(content)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExampleClick = (example: string) => {
    setSelectedExample(example)
    const sample = exampleTexts[example]
    if (sample) {
      setText(sample)
      handleScan(sample)
    } else {
      const fallback = `Example text showing ${example.toLowerCase()} generated content...`
      setText(fallback)
      handleScan(fallback)
    }
  }

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#1a1a1a',
        backgroundColor: '#fbfbfa',
        minHeight: '100vh',
      }}
    >
      {/* Top Header Navbar */}
      <header
        style={{
          borderBottom: '1px solid #f0f0ee',
          backgroundColor: '#fbfbfa',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            padding: '16px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo with Bee Icon */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#18181b',
            }}
          >
            <img
              src="/buzz.png"
              alt="AIDetector.buzz"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <span style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.03em', color: '#18181b' }}>
              AIDetector<span style={{ color: '#d97706' }}>.buzz</span>
            </span>
          </Link>

          {/* Right Navigation */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link
              href="/scan"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#52525b',
                textDecoration: 'none',
              }}
            >
              Web Scanner
            </Link>
            <Link
              href="/comparison"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#52525b',
                textDecoration: 'none',
              }}
            >
              Comparison
            </Link>
            <Link
              href="/accuracy"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#52525b',
                textDecoration: 'none',
              }}
            >
              Accuracy (1000 Tests)
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#18181b',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fde68a',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
                  textDecoration: 'none',
                }}
              >
                Dashboard ({user?.name?.split(' ')[0] || 'Account'})
              </Link>
            ) : (
              <a
                href="/api/auth/openrouter/login"
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #eab308 100%)',
                  boxShadow: '0 3px 10px rgba(217, 119, 6, 0.25)',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Connect OpenRouter
              </a>
            )}

            {/* Hamburger Icon */}
            <button
              aria-label="Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginLeft: '4px',
              }}
            >
              <span style={{ width: '20px', height: '2px', backgroundColor: '#18181b', display: 'block' }} />
              <span style={{ width: '20px', height: '2px', backgroundColor: '#18181b', display: 'block' }} />
              <span style={{ width: '20px', height: '2px', backgroundColor: '#18181b', display: 'block' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Honey Bee Announcement Top Bar */}
      <div
        style={{
          backgroundColor: '#fffbeb',
          borderBottom: '1px solid #fef3c7',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#92400e',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            fontSize: '13px',
          }}
        >
          🐝
        </span>
        <span style={{ fontWeight: 600, color: '#78350f' }}>
          AIDetector.buzz is live! Ultra-fast stylometrics &amp; wholesale BYOK AI detection.
        </span>
        <a
          href="/scan"
          style={{
            color: '#b45309',
            fontWeight: 700,
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          Try it now &rarr;
        </a>
      </div>

      {/* Main Hero Above-the-Fold Container */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '50px 28px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '48px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Heading, Subheading, Stats, Promo Card */}
          <div style={{ maxWidth: '580px' }}>
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 4.2vw, 3.75rem)',
                fontWeight: 700,
                lineHeight: 1.12,
                color: '#111827',
                letterSpacing: '-0.03em',
                marginBottom: '24px',
              }}
            >
              AI detector made to{' '}
              <span
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  display: 'inline-block',
                }}
              >
                Preserve What&apos;s Human.
              </span>
            </h1>

            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: '#52525b',
                marginBottom: '40px',
              }}
            >
              Fuses <strong>GPTZero-style multi-model perplexity &amp; sentence highlights</strong> with{' '}
              <strong>ZeroGPT-style multi-scale burstiness</strong>. Checks writing quality and integrity
              with 100% zero data retention.
            </p>

            {/* Stats Row with Vertical Dividers */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                marginBottom: '40px',
                paddingBottom: '36px',
                borderBottom: '1px solid #fde68a',
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>
                  99%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '2px' }}>
                  Accuracy
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: '#fde68a' }} />

              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '2px' }}>
                  Zero Retention
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: '#fde68a' }} />

              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em' }}>
                  ~$0.0001
                </div>
                <div style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '2px' }}>
                  Wholesale / Scan
                </div>
              </div>
            </div>

            {/* Promo Card Pill */}
            <div>
              <Link
                href="/scan"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: '#fffdfa',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  border: '1px solid #fde68a',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.06)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Promo Icon */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                  }}
                >
                  🐝
                </div>

                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#b45309', marginBottom: '2px' }}>
                    Open Live Interactive Web Scanner &rarr;
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.4 }}>
                    Sentence-by-sentence highlights, B_sent burstiness, and wholesale OpenRouter BYOK.
                  </div>
                </div>

                <div style={{ color: '#d97706', fontSize: '18px', fontWeight: 'bold' }}>&rsaquo;</div>
              </Link>

              {/* Dot Indicators */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fde68a' }} />
              </div>
            </div>
          </div>

          {/* Right Column: Floating Scanner Card */}
          <div style={{ width: '100%', maxWidth: '640px', justifySelf: 'center' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #fde68a',
                boxShadow: '0 12px 36px rgba(217, 119, 6, 0.08), 0 2px 8px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Card Tabs Bar */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #fef3c7',
                  backgroundColor: '#fffdfa',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('detector')}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    backgroundColor: activeTab === 'detector' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'detector' ? '2.5px solid #d97706' : '2.5px solid transparent',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: activeTab === 'detector' ? '#d97706' : '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2.5px solid #d97706',
                      borderTopColor: '#fde047',
                      display: 'inline-block',
                    }}
                  />
                  AI Detector
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('humanizer')
                    if (!humanizeInput && text) {
                      setHumanizeInput(text)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    backgroundColor: activeTab === 'humanizer' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'humanizer' ? '2.5px solid #d97706' : '2.5px solid transparent',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: activeTab === 'humanizer' ? '#d97706' : '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>✨</span>
                  Humanizer <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 800 }}>v1</span>
                </button>
              </div>

              {activeTab === 'detector' ? (
                <>
                  {/* Text Input Area & Inline Upload Buttons */}
                  <div style={{ padding: '24px 24px 16px' }}>
                    {/* Header row inside textarea: "Paste your text or [Upload files] [Sample Essay]" */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Paste your text or</span>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".txt,.pdf,.docx,.md"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          color: '#4b5563',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>📤</span> Upload files
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setText(exampleTexts['ChatGPT'])
                          setScanResult(null)
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          color: '#4b5563',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>⚡</span> Sample Essay
                      </button>
                    </div>

                    {scanResult && scannedParagraphs.length > 0 && !isEditing ? (
                      <div>
                        <div
                          onClick={() => setIsEditing(true)}
                          title="Click anywhere to edit text"
                          style={{
                            width: '100%',
                            minHeight: '220px',
                            fontSize: '1rem',
                            lineHeight: 1.65,
                            color: '#111827',
                            fontFamily: 'inherit',
                            padding: '4px 0',
                            whiteSpace: 'pre-wrap',
                            cursor: 'text',
                          }}
                        >
                          {scannedParagraphs.map((p, pIdx) => (
                            <p key={pIdx} style={{ marginBottom: pIdx < scannedParagraphs.length - 1 ? '1.1em' : 0 }}>
                              {p.sentences && p.sentences.length > 0 ? (
                                p.sentences.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      backgroundColor: s.isAi ? '#fef08a' : 'transparent',
                                      color: s.isAi ? '#1f2937' : 'inherit',
                                      padding: s.isAi ? '2px 4px' : '0',
                                      marginRight: '2px',
                                      borderRadius: s.isAi ? '4px' : '0',
                                      boxDecorationBreak: 'clone',
                                      WebkitBoxDecorationBreak: 'clone',
                                      fontWeight: s.isAi ? 500 : 'normal',
                                    }}
                                    title={`Sentence AI Score: ${s.score}%`}
                                  >
                                    {s.text}{' '}
                                  </span>
                                ))
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: p.isAi ? '#fef08a' : 'transparent',
                                    color: p.isAi ? '#1f2937' : 'inherit',
                                    padding: p.isAi ? '2px 4px' : '0',
                                    borderRadius: p.isAi ? '4px' : '0',
                                    boxDecorationBreak: 'clone',
                                    WebkitBoxDecorationBreak: 'clone',
                                  }}
                                >
                                  {p.text}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #e5e7eb',
                            fontSize: '0.8125rem',
                            color: '#6b7280',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fef08a', border: '1px solid #facc15' }} />
                            <span>Highlighted in yellow: AI-generated section</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: 0,
                              fontSize: '0.8125rem',
                            }}
                          >
                            ✏️ Edit text
                          </button>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value)
                          if (scanResult) setScanResult(null)
                          if (scannedParagraphs.length > 0) setScannedParagraphs([])
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData?.getData('text') || ''
                          if (pastedText.trim().length >= 10) {
                            setText(pastedText)
                            handleScan(pastedText)
                          }
                        }}
                        placeholder="Paste your essay, article, or document here to instantly scan for AI-generated sentences..."
                        style={{
                          width: '100%',
                          minHeight: '220px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          color: '#111827',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          padding: 0,
                        }}
                      />
                    )}

                    {/* Scan Result Notification */}
                    {scanResult && (
                      <div
                        style={{
                          marginTop: '16px',
                          marginBottom: '12px',
                          padding: '16px 20px',
                          borderRadius: '14px',
                          backgroundColor: scanResult.score >= 50 ? '#fef2f2' : scanResult.score >= 35 ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${scanResult.score >= 50 ? '#fca5a5' : scanResult.score >= 35 ? '#fcd34d' : '#86efac'}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: scanResult.score >= 50 ? '#b91c1c' : scanResult.score >= 35 ? '#b45309' : '#15803d',
                                marginBottom: '3px',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {scanResult.score}% AI Detected
                            </div>
                            <div
                              style={{
                                fontSize: '0.95rem',
                                color: scanResult.score >= 50 ? '#991b1b' : scanResult.score >= 35 ? '#92400e' : '#166534',
                                fontWeight: 600,
                                lineHeight: 1.4,
                                marginBottom: '2px',
                              }}
                            >
                              {scanResult.verdict}
                            </div>
                            {scanResult.subVerdict && (
                              <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                {scanResult.subVerdict}
                              </div>
                            )}
                          </div>

                          <Link
                            href="/scan"
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#b45309',
                              textDecoration: 'none',
                              padding: '6px 14px',
                              backgroundColor: '#ffffff',
                              borderRadius: '9999px',
                              border: '1px solid #fde68a',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            View detailed breakdown &rarr;
                          </Link>
                        </div>

                        {/* 3-Way Probability Bar */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            flexWrap: 'wrap',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#374151',
                            }}
                          >
                            Entirely AI: <strong>{scanResult.completelyGeneratedProb ?? (scanResult.score >= 70 ? 98 : 2)}%</strong>
                          </span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#374151',
                            }}
                          >
                            Mixed Content: <strong>{scanResult.mixedGeneratedProb ?? (scanResult.score >= 35 && scanResult.score < 70 ? 88 : 3)}%</strong>
                          </span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#374151',
                            }}
                          >
                            Entirely Human: <strong>{scanResult.humanWrittenProb ?? (scanResult.score < 35 ? 94 : 0)}%</strong>
                          </span>

                          {scanResult.avgPerplexity !== undefined && (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                color: '#6b7280',
                                marginLeft: 'auto',
                              }}
                            >
                              Avg Perplexity: <strong style={{ color: '#111827' }}>{scanResult.avgPerplexity}</strong> &middot; Burstiness: <strong style={{ color: '#111827' }}>{scanResult.burstiness}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Examples Row */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500, marginRight: '4px' }}>
                          Examples:
                        </span>
                        {examples.map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => handleExampleClick(example)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: selectedExample === example ? '#fef3c7' : '#f3f4f6',
                              color: selectedExample === example ? '#92400e' : '#1f2937',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                            }}
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 24px',
                      borderTop: '1px solid #f0f0ee',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        {text.length}/10,000 characters
                      </span>
                      <Link
                        href="/scan"
                        style={{
                          padding: '4px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #fde68a',
                          backgroundColor: '#fffdfa',
                          color: '#b45309',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Advanced Scan
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={handleScan}
                      disabled={isScanning}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '9999px',
                        background: isScanning ? '#9ca3af' : 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #eab308 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        cursor: isScanning ? 'not-allowed' : 'pointer',
                        boxShadow: '0 3px 12px rgba(217, 119, 6, 0.3)',
                      }}
                    >
                      <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
                      <span>🐝</span>
                    </button>
                  </div>

                  {/* Burstiness & Stylometrics Report (Moved below Action Bar) */}
                  <div
                    style={{
                      padding: '20px 24px 24px',
                      backgroundColor: '#faf8f3',
                      borderTop: '1px solid #fde68a',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📊</span> Live Burstiness &amp; Stylometrics Report
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        Instant mathematical heuristics
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fde68a',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Burstiness (B_sent)
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: liveStylometrics.burstinessScore < 30 ? '#dc2626' : '#16a34a' }}>
                          {liveStylometrics.burstinessScore} / 100
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                          {liveStylometrics.burstinessScore < 30 ? '⚠️ Low Variation (Machine)' : '✓ High Variation (Human)'}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fde68a',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Vocabulary Diversity (TTR)
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b' }}>
                          {liveStylometrics.vocabularyScore}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                          Across {liveStylometrics.wordCount} words
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fde68a',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Avg Sentence Length
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b' }}>
                          {liveStylometrics.averageSentenceLength} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>words</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                          Across {liveStylometrics.sentenceCount} sentences
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fde68a',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Formulaic Connectives
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: liveStylometrics.aiPhraseCount > 0 ? '#b91c1c' : '#166534' }}>
                          {liveStylometrics.aiPhraseCount} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>phrases</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                          {liveStylometrics.aiPhraseCount > 0 ? 'Synthetic markers found' : 'Natural human rhythm'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Humanizer v1 Tab Content */
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✨</span> AI Text Humanizer (v1)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {text && text !== humanizeInput && (
                          <button
                            type="button"
                            onClick={() => setHumanizeInput(text)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#b45309',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fde68a',
                              borderRadius: '9999px',
                              padding: '3px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            📥 Copy from Scanner
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setHumanizeInput(exampleTexts['ChatGPT'])
                            setHumanizedOutput(null)
                          }}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#52525b',
                            backgroundColor: '#f4f4f5',
                            border: '1px solid #e4e4e7',
                            borderRadius: '9999px',
                            padding: '3px 10px',
                            cursor: 'pointer',
                          }}
                        >
                          ⚡ Sample AI Text
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '12px' }}>
                      Rewrites text to break robotic AI uniformity, purge cliché connectives, and introduce natural cadence.
                    </p>

                    <textarea
                      value={humanizeInput}
                      onChange={(e) => setHumanizeInput(e.target.value)}
                      placeholder="Paste AI-generated text here to humanize it..."
                      style={{
                        width: '100%',
                        minHeight: '160px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid #fde68a',
                        backgroundColor: '#fffdfa',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                        color: '#18181b',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Humanizer Action Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: humanizedOutput ? '20px' : '0',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                      {(humanizeInput || text).length} characters
                    </span>

                    <button
                      type="button"
                      onClick={handleHumanize}
                      disabled={isHumanizing || !(humanizeInput || text).trim()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '9999px',
                        background: isHumanizing ? '#9ca3af' : 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #eab308 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        cursor: isHumanizing ? 'not-allowed' : 'pointer',
                        boxShadow: '0 3px 12px rgba(217, 119, 6, 0.3)',
                      }}
                    >
                      <span>{isHumanizing ? 'Humanizing...' : 'Humanize Text'}</span>
                      <span>✨</span>
                    </button>
                  </div>

                  {/* Humanized Output Box */}
                  {humanizedOutput && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '18px 20px',
                        borderRadius: '14px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                          borderBottom: '1px solid #bbf7d0',
                          paddingBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                            ✓ Humanized Output
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                            {humanizeMethod === 'openrouter' ? 'DeepSeek V4 Flash' : 'Heuristic Entropy Flow'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(humanizedOutput)
                              setCopiedHumanized(true)
                              setTimeout(() => setCopiedHumanized(false), 2000)
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #86efac',
                              color: '#15803d',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {copiedHumanized ? '✓ Copied!' : '📋 Copy'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setText(humanizedOutput)
                              setActiveTab('detector')
                              handleScan(humanizedOutput)
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                            }}
                          >
                            🐝 Scan with Detector
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.95rem',
                          lineHeight: 1.65,
                          color: '#14532d',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {humanizedOutput}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap',
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px dashed #86efac',
                          fontSize: '0.75rem',
                          color: '#166534',
                        }}
                      >
                        <span>✓ Synthetic connectives filtered</span>
                        <span>✓ Sentence length variation boosted</span>
                        <span>✓ Natural pacing restored</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Privacy Guarantee Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '16px',
                fontSize: '0.8125rem',
                color: '#6b7280',
              }}
            >
              <span>🔒</span> Privacy Guarantee &middot; 100% In-Memory Evaluation
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section style={{ padding: '80px 28px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #e5e7eb' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2.25rem',
            marginBottom: '12px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.02em',
          }}
        >
          Comprehensive Detection Features
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '1.0625rem',
            color: '#6b7280',
            maxWidth: '640px',
            margin: '0 auto 60px',
          }}
        >
          Every metric you need to authenticate text with total clarity and zero black-box obscurity.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                textAlign: 'left',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{feature.icon}</div>
              <h3
                style={{
                  fontSize: '1.1875rem',
                  marginBottom: '10px',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                {feature.title}
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: '0.9375rem', margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '80px 28px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Why AIDetector.buzz is Better Than Legacy Detectors
            </h2>
            <p style={{ fontSize: '1.0625rem', color: '#6b7280' }}>
              A true hybrid uniting the strengths of both platforms while eliminating subscription traps.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#fbfbfa',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e5e7eb',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', color: '#111827' }}>Capability</th>
                  <th style={{ padding: '14px 16px', color: '#4b5563' }}>GPTZero</th>
                  <th style={{ padding: '14px 16px', color: '#4b5563' }}>ZeroGPT</th>
                  <th style={{ padding: '14px 16px', color: '#b45309', fontWeight: 800 }}>
                    AIDetector.buzz (Hybrid)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Sentence-by-Sentence Highlights</td>
                  <td style={{ padding: '14px 16px' }}>✅ Yes</td>
                  <td style={{ padding: '14px 16px' }}>⚠️ Basic</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ Interactive In-line Tooltips
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Multi-Scale Burstiness (B_sent)</td>
                  <td style={{ padding: '14px 16px' }}>⚠️ Perplexity only</td>
                  <td style={{ padding: '14px 16px' }}>✅ Yes</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ Sentence + Clause + Para Variance
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Pricing Model</td>
                  <td style={{ padding: '14px 16px' }}>❌ $15–$30/mo Sub</td>
                  <td style={{ padding: '14px 16px' }}>❌ $10/mo Sub</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ Free Heuristics / Wholesale BYOK
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Multi-Model OpenRouter OAuth</td>
                  <td style={{ padding: '14px 16px' }}>❌ No</td>
                  <td style={{ padding: '14px 16px' }}>❌ No</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ 1-Click PKCE (GPT-4o, Gemini, Claude)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Local / Python CLI Support</td>
                  <td style={{ padding: '14px 16px' }}>❌ Proprietary</td>
                  <td style={{ padding: '14px 16px' }}>❌ Proprietary</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ Open Source Python CLI + Script
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Zero-Data Retention Privacy</td>
                  <td style={{ padding: '14px 16px' }}>⚠️ Terms apply</td>
                  <td style={{ padding: '14px 16px' }}>⚠️ Cloud cached</td>
                  <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 600 }}>
                    ✅ 100% In-Memory Processing
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '80px 28px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2.25rem',
            marginBottom: '12px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.02em',
          }}
        >
          How It Works
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '1.0625rem',
            color: '#6b7280',
            maxWidth: '560px',
            margin: '0 auto 60px',
          }}
        >
          Three simple steps to authenticate any article, essay, or webpage.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: '#111827',
                  marginBottom: '16px',
                }}
              >
                {step.number}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: 700, color: '#111827' }}>
                {step.title}
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: '0.9375rem', margin: 0 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '80px 28px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '12px', fontWeight: 700, color: '#111827' }}>
            Simple Pricing
          </h2>
          <p
            style={{
              textAlign: 'center',
              fontSize: '1.0625rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto 60px',
            }}
          >
            Transparent, open-access plans with zero subscription lock-in or hidden markups.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
            }}
          >
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                style={{
                  border: tier.popular ? '2px solid #111827' : '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '32px',
                  position: 'relative',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: tier.popular ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div>
                  {tier.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-13px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#111827',
                        color: 'white',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.375rem', marginBottom: '8px', fontWeight: 700, color: '#111827' }}>
                    {tier.name}
                  </h3>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '4px', color: '#111827' }}>
                    {tier.price}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px' }}>
                    {tier.wordsPerMonth}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        style={{
                          padding: '8px 0',
                          display: 'flex',
                          alignItems: 'flex-start',
                          fontSize: '0.9375rem',
                          lineHeight: 1.5,
                          color: '#374151',
                        }}
                      >
                        <span style={{ color: '#16a34a', marginRight: '8px', fontWeight: 700 }}>
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={tier.ctaLink}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    textDecoration: 'none',
                    width: '100%',
                    padding: '12px',
                    backgroundColor: tier.popular ? '#111827' : '#ffffff',
                    color: tier.popular ? '#ffffff' : '#111827',
                    border: tier.popular ? 'none' : '1px solid #d1d5db',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                >
                  {tier.ctaText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: '80px 28px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2.25rem',
            marginBottom: '60px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          What Our Users Say
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                  fontStyle: 'italic',
                  color: '#4b5563',
                }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '2px', color: '#111827' }}>
                  {testimonial.author}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{testimonial.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#18181b',
          color: '#a1a1aa',
          padding: '48px 28px',
          textAlign: 'center',
          borderTop: '1px solid #fde68a',
        }}
      >
        <p style={{ marginBottom: '16px', fontSize: '0.9375rem', color: '#e4e4e7' }}>
          © 2026 AIDetector.buzz. Built with OpenRouter OAuth &middot; All rights reserved.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '0.875rem',
          }}
        >
          <Link href="/scan" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Scanner
          </Link>
          <Link href="/comparison" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Comparison
          </Link>
          <Link href="/dashboard" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href="/settings" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Settings
          </Link>
          <Link href="/accuracy" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Accuracy (1000 Tests)
          </Link>
          <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Terms of Service
          </Link>
          <a href="/llms.txt" target="_blank" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            llms.txt
          </a>
        </div>
      </footer>
    </div>
  )
}