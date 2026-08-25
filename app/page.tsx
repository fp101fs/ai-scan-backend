import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth'

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

const features: Feature[] = [
  {
    icon: '⚡',
    title: 'Dual-Engine Detection (AI + Heuristics)',
    description:
      'Combines OpenRouter LLM stylometrics with offline Perplexity, Burstiness variance, and Type-Token Ratio analysis for rock-solid accuracy.',
  },
  {
    icon: '🔑',
    title: 'OpenRouter OAuth (BYOK)',
    description:
      'Sign in directly with OpenRouter via secure PKCE OAuth. Use your existing credits, choose your preferred model, and track spending transparently.',
  },
  {
    icon: '🧩',
    title: 'Chrome Extension & Web Platform',
    description:
      'Scan entire web pages on-the-fly as you browse, or paste articles, essays, and documents into the web scanner for granular paragraph breakdowns.',
  },
  {
    icon: '📊',
    title: 'Deep-Linked Usage & Logs',
    description:
      'Seamlessly view your token logs and key management directly on OpenRouter with automated cryptographic key hashing.',
  },
  {
    icon: '🛡️',
    title: 'Privacy-First Architecture',
    description:
      'Zero text retention. Your scanned content is processed on-demand and never stored, indexed, or used for model training.',
  },
  {
    icon: '🎯',
    title: 'Multi-Model Benchmarks',
    description:
      'Toggle seamlessly between GPT-4o Mini, Gemini 2.5 Flash, DeepSeek Chat, or zero-cost offline heuristic analysis.',
  },
]

const steps: Step[] = [
  {
    number: '01',
    title: 'Connect with OpenRouter',
    description: 'Authorize with 1-click OAuth PKCE — no copy-pasting API keys required.',
  },
  {
    number: '02',
    title: 'Select Detection Mode',
    description: 'Choose Hybrid (AI + Heuristic), Pure AI, or zero-cost Offline Heuristics.',
  },
  {
    number: '03',
    title: 'Analyze & Inspect',
    description: 'Get an instant AI-probability score with sentence-level stylometric breakdowns.',
  },
]

export default async function Home() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    session = null
  }

  const isAuthenticated = Boolean(session?.user)
  const user = session?.user as any

  return (
    <>
      {/* Product Hunt Launch Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(255, 97, 84, 0.15), rgba(99, 102, 241, 0.15))',
          borderBottom: '1px solid rgba(255, 97, 84, 0.25)',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span style={{ marginRight: 8 }}>🚀</span>
        <strong>We are launching on Product Hunt!</strong> Support our open AI detection platform.{' '}
        <a
          href="https://www.producthunt.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: '#ff6154', fontWeight: 600, marginLeft: 4 }}
        >
          Check out our launch →
        </a>
      </div>

      <header>
        <div className="container flex-between" style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              <span className="text-gradient">AI Scan</span>
            </h2>
            <span className="badge badge-neutral" style={{ fontSize: 10 }}>v2.0 · OpenRouter</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/scan" className="btn btn-secondary btn-sm">
              Web Scanner
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard ({user?.name?.split(' ')[0] || 'Account'})
              </Link>
            ) : (
              <Link href="/api/auth/openrouter/login" className="btn btn-primary btn-sm">
                Connect OpenRouter
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section style={{ padding: '80px 0 60px', textAlign: 'center' }}>
          <div className="container">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 9999,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                marginBottom: 24,
                fontSize: 13,
                color: '#a5b4fc',
              }}
            >
              <span>✨</span> Powered by OpenRouter OAuth & Statistical Heuristics
            </div>

            <h1
              className="text-gradient"
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 24,
                maxWidth: 880,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              The Open, Transparent AI Content Detector
            </h1>

            <p
              className="text-secondary"
              style={{
                maxWidth: 680,
                margin: '0 auto 36px',
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              Detect AI-generated text with mathematical precision. Connect your OpenRouter account via 1-click OAuth (BYOK) for unmetered, privacy-focused scanning across web pages and documents.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Link href="/scan" className="btn btn-primary btn-lg">
                  Launch Web Scanner →
                </Link>
              ) : (
                <Link href="/api/auth/openrouter/login" className="btn btn-primary btn-lg">
                  <span style={{ fontSize: 18 }}>🔑</span> Connect with OpenRouter
                </Link>
              )}
              <Link href="/scan" className="btn btn-secondary btn-lg">
                Try Free Demo (Offline Heuristics)
              </Link>
            </div>

            {/* Feature highlights bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginTop: 48,
                flexWrap: 'wrap',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              <span>✓ No subscription lock-in</span>
              <span>✓ 100% BYOK transparent pricing</span>
              <span>✓ Perplexity & Burstiness breakdowns</span>
              <span>✓ Chrome extension compatible</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, marginBottom: 12 }}>
                Built for Researchers, Creators & Educators
              </h2>
              <p className="text-secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
                Everything you need to verify content authenticity with full transparency and zero black-box obscurity.
              </p>
            </div>

            <div className="card-grid-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card glass-card-interactive animate-slide-up"
                >
                  <span style={{ fontSize: '36px', display: 'block', marginBottom: 16 }}>
                    {feature.icon}
                  </span>
                  <h3 className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>
                    {feature.title}
                  </h3>
                  <p className="card-subtitle" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section" style={{ background: 'rgba(13, 13, 34, 0.4)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, marginBottom: 12 }}>
                How It Works
              </h2>
              <p className="text-secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
                Three simple steps to authenticate any article, essay, or webpage.
              </p>
            </div>

            <div className="card-grid-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="glass-card glass-card-interactive animate-slide-up"
                >
                  <span
                    className="text-gradient"
                    style={{
                      fontSize: '44px',
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'block',
                      marginBottom: 16,
                    }}
                  >
                    {step.number}
                  </span>
                  <h3 className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>
                    {step.title}
                  </h3>
                  <p className="card-subtitle" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section">
          <div className="container" style={{ maxWidth: 800 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, marginBottom: 12 }}>
                Frequently Asked Questions
              </h2>
              <p className="text-secondary">
                Common questions about AI Scan, OpenRouter OAuth, and our detection methodology.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  What is OpenRouter OAuth (PKCE) and why do we use it?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  OpenRouter OAuth allows you to authorize AI Scan with a single click without manually generating or copying API keys. Your credits remain in your personal OpenRouter account, so you only pay direct inference rates with zero platform markup.
                </p>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  Can I use AI Scan without an OpenRouter account?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Yes! AI Scan includes a built-in Offline Heuristic Engine that analyzes sentence length variance (Burstiness), Type-Token Ratio (Vocabulary diversity), and structural transition markers completely free and locally in your browser.
                </p>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  Is my scanned content stored or shared?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  No. Scanned text is processed in-memory during the analysis request and is never logged into a database, retained, or utilized to train machine learning models.
                </p>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  How does the Chrome Extension connect to this backend?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  The AI Scan Chrome Extension connects seamlessly via our authenticated token endpoints, allowing you to highlight text on any website or perform full-page real-time scans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ padding: '60px 0 100px', textAlign: 'center' }}>
          <div className="container">
            <div
              className="glass-card"
              style={{
                maxWidth: 800,
                margin: '0 auto',
                padding: '48px 32px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                borderColor: 'var(--border-strong)',
              }}
            >
              <h2 className="text-gradient" style={{ fontSize: 32, marginBottom: 16 }}>
                Ready to verify content authenticity?
              </h2>
              <p className="text-secondary" style={{ maxWidth: 500, margin: '0 auto 28px', fontSize: 16 }}>
                Join thousands of writers, researchers, and developers using transparent AI detection.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/scan" className="btn btn-primary btn-lg">
                  Launch Web Scanner Now
                </Link>
                {!isAuthenticated && (
                  <Link href="/api/auth/openrouter/login" className="btn btn-secondary btn-lg">
                    Sign in with OpenRouter
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: '40px 0', borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <p className="text-muted" style={{ fontSize: 14 }}>
            © 2026 AI Scan. Built with OpenRouter OAuth · All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }} className="text-secondary">
            <Link href="/scan" className="text-link">Scanner</Link>
            <Link href="/dashboard" className="text-link">Dashboard</Link>
            <Link href="/settings" className="text-link">Settings</Link>
            <a href="/llms.txt" target="_blank" className="text-link">llms.txt</a>
          </div>
        </div>
      </footer>
    </>
  )
}