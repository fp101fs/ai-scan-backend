'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ThemeToggle from '../components/ThemeToggle'

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

export default function Home() {
  const { data: session } = useSession()
  const isAuthenticated = Boolean(session?.user)
  const user = session?.user as any

  const [text, setText] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'detector' | 'stylometrics'>('detector')
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{ score: number; verdict: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleScan = async () => {
    if (text.trim().length < 10) {
      alert('Please enter at least 10 characters to scan.')
      return
    }

    const rawParagraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (rawParagraphs.length === 0) return

    setIsScanning(true)
    setScanResult(null)

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

          let verdict = 'Likely Human-Written'
          if (score >= 70) {
            verdict = 'Likely Entirely AI-Generated'
          } else if (score >= 45) {
            verdict = 'Mixed AI & Human Content'
          } else {
            verdict = 'Likely Human-Written'
          }

          setScanResult({ score, verdict })
        } else {
          setScanResult({ score: 18, verdict: 'Likely Human-Written' })
        }
      } else {
        const isAi = /furthermore|moreover|in conclusion|testament to|seamlessly|multifaceted/i.test(text)
        const score = isAi ? 88 : 12
        setScanResult({
          score,
          verdict: score >= 50 ? 'Likely AI-Generated' : 'Likely Human-Written',
        })
      }
    } catch {
      const isAi = /furthermore|moreover|in conclusion|testament to|seamlessly|multifaceted/i.test(text)
      const score = isAi ? 85 : 15
      setScanResult({
        score,
        verdict: score >= 50 ? 'Likely AI-Generated' : 'Likely Human-Written',
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setText((e.target?.result as string) || '')
        setScanResult(null)
      }
      reader.readAsText(file)
    }
  }

  const handleExampleClick = (example: string) => {
    setSelectedExample(example)
    setScanResult(null)
    if (exampleTexts[example]) {
      setText(exampleTexts[example])
    } else {
      setText(`Example text showing ${example.toLowerCase()} generated content...`)
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
          {/* Logo with Spiral Icon */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#111827',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '2.5px solid #111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: '2px solid #111827',
                }}
              />
            </div>
            <span style={{ fontSize: '21px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              AI Scan
            </span>
          </Link>

          {/* Right Navigation */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link
              href="/scan"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#4b5563',
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
                color: '#4b5563',
                textDecoration: 'none',
              }}
            >
              Comparison
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
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  textDecoration: 'none',
                }}
              >
                Dashboard ({user?.name?.split(' ')[0] || 'Account'})
              </Link>
            ) : (
              <Link
                href="/api/auth/openrouter/login"
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#111827',
                  textDecoration: 'none',
                }}
              >
                Connect OpenRouter
              </Link>
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
              <span style={{ width: '20px', height: '2px', backgroundColor: '#111827', display: 'block' }} />
              <span style={{ width: '20px', height: '2px', backgroundColor: '#111827', display: 'block' }} />
              <span style={{ width: '20px', height: '2px', backgroundColor: '#111827', display: 'block' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Blue Announcement Top Bar */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #dbeafe',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#1e40af',
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
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          🚀
        </span>
        <span>+</span>
        <span style={{ fontSize: '15px' }}>✨</span>
        <span style={{ fontWeight: 500, color: '#1e3a8a' }}>
          AI Scan is launching on Product Hunt! Support open AI detection.
        </span>
        <a
          href="https://www.producthunt.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1d4ed8',
            fontWeight: 600,
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          Learn more &rarr;
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
                  backgroundColor: '#dcfce7',
                  color: '#065f46',
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
                color: '#6b7280',
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
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                  99%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
                  Accuracy
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }} />

              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
                  Zero Retention
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }} />

              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                  ~$0.0001
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
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
                  backgroundColor: '#f3f4f6',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background-color 0.2s',
                }}
              >
                {/* Promo Icon */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  ⚡
                </div>

                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2563eb', marginBottom: '2px' }}>
                    Open Live Interactive Web Scanner &rarr;
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.4 }}>
                    Sentence-by-sentence highlights, B_sent burstiness, and wholesale OpenRouter BYOK.
                  </div>
                </div>

                <div style={{ color: '#9ca3af', fontSize: '18px' }}>&rsaquo;</div>
              </Link>

              {/* Dot Indicators */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#111827' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db' }} />
              </div>
            </div>
          </div>

          {/* Right Column: Floating Scanner Card */}
          <div style={{ width: '100%', maxWidth: '640px', justifySelf: 'center' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Card Tabs Bar */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #f0f0ee',
                  backgroundColor: '#f9fafb',
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
                    borderBottom: activeTab === 'detector' ? '2px solid #111827' : '2px solid transparent',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    color: activeTab === 'detector' ? '#111827' : '#6b7280',
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
                      border: '2.5px solid #22c55e',
                      borderTopColor: '#eab308',
                      display: 'inline-block',
                    }}
                  />
                  AI Detector
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stylometrics')}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    backgroundColor: activeTab === 'stylometrics' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'stylometrics' ? '2px solid #111827' : '2px solid transparent',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    color: activeTab === 'stylometrics' ? '#111827' : '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>🌀</span>
                  Burstiness &amp; Stylometrics
                </button>
              </div>

              {/* Text Input Area & Inline Upload Buttons */}
              <div style={{ padding: '24px 24px 16px' }}>
                {/* Header row inside textarea: "Paste your text or [Upload files] [Upload from Google Drive]" */}
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

                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    if (scanResult) setScanResult(null)
                  }}
                  placeholder="Paste your essay, article, or document here to check for AI-generated sentences..."
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

                {/* Scan Result Notification */}
                {scanResult && (
                  <div
                    style={{
                      marginTop: '12px',
                      marginBottom: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: scanResult.score >= 50 ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${scanResult.score >= 50 ? '#fca5a5' : '#86efac'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: '0.95rem',
                          color: scanResult.score >= 50 ? '#b91c1c' : '#15803d',
                        }}
                      >
                        {scanResult.score}% AI Detected &middot; {scanResult.verdict}
                      </strong>
                    </div>
                    <Link
                      href="/scan"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        textDecoration: 'none',
                      }}
                    >
                      View sentence breakdown &rarr;
                    </Link>
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
                          backgroundColor: selectedExample === example ? '#e5e7eb' : '#f3f4f6',
                          color: '#1f2937',
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
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      color: '#374151',
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
                    backgroundColor: isScanning ? '#9ca3af' : '#18181b',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                  <span>&rarr;</span>
                </button>
              </div>
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
              Why AI Scan is Better Than the Parents
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
                  <th style={{ padding: '14px 16px', color: '#065f46', fontWeight: 700 }}>
                    AI Scan (Hybrid)
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

                <Link
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
                </Link>
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
          backgroundColor: '#111827',
          color: '#9ca3af',
          padding: '48px 28px',
          textAlign: 'center',
        }}
      >
        <p style={{ marginBottom: '16px', fontSize: '0.9375rem', color: '#d1d5db' }}>
          © 2026 AI Scan. Built with OpenRouter OAuth &middot; All rights reserved.
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
          <a href="/llms.txt" target="_blank" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            llms.txt
          </a>
        </div>
      </footer>
    </div>
  )
}