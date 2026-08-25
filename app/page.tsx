import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth'
import ThemeToggle from '../components/ThemeToggle'

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
    description: 'Paste text, upload a document (.txt, .md), or scan live web pages with the Chrome Extension.',
  },
  {
    number: '02',
    title: 'Choose Detection Mode',
    description: 'Select Hybrid (AI + Stylometrics), Fast ZeroGPT Heuristics, or Multi-Model LLM verification.',
  },
  {
    number: '03',
    title: 'Inspect Sentence Highlights',
    description: 'Get an instant radial score dial, sentence-by-sentence color highlights, and stylometric breakdowns.',
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
          Check out our launch &rarr;
        </a>
      </div>

      <header>
        <div className="container flex-between" style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              <span className="text-gradient">AI Scan</span>
            </h2>
            <span className="badge badge-neutral" style={{ fontSize: 10 }}>GPTZero + ZeroGPT Hybrid</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/scan" className="btn btn-secondary btn-sm">
              Launch Web Scanner
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard ({user?.name?.split(' ')[0] || 'Account'})
              </Link>
            ) : (
              <Link href="/api/auth/openrouter/login" className="btn btn-primary btn-sm">
                Connect OpenRouter (BYOK)
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section style={{ padding: '70px 0 50px', textAlign: 'center' }}>
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
              <span>✨</span> The Best of GPTZero &amp; ZeroGPT Combined
            </div>

            <h1
              className="text-gradient"
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 24,
                maxWidth: 920,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              The Open, Transparent AI Content Detector
            </h1>

            <p
              className="text-secondary"
              style={{
                maxWidth: 700,
                margin: '0 auto 36px',
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              Fuses <strong>GPTZero-style multi-model perplexity &amp; sentence highlights</strong> with <strong>ZeroGPT-style multi-scale burstiness</strong>. Connect your OpenRouter account via 1-click OAuth (BYOK) or use free offline heuristics.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/scan" className="btn btn-primary btn-lg">
                ⚡ Try Live Web Scanner Now &rarr;
              </Link>
              {!isAuthenticated && (
                <Link href="/api/auth/openrouter/login" className="btn btn-secondary btn-lg">
                  <span style={{ fontSize: 18 }}>🔑</span> Connect OpenRouter (BYOK)
                </Link>
              )}
            </div>

            {/* Comparison pill bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginTop: 40,
                flexWrap: 'wrap',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              <span>✓ In-line Sentence Highlighting</span>
              <span>✓ Sentence Burstiness (B_sent)</span>
              <span>✓ Zero Subscription Lock-in</span>
              <span>✓ 100% Zero-Retention Privacy</span>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE (GPTZero vs ZeroGPT vs AI Scan) */}
        <section className="section" style={{ background: 'rgba(13, 13, 34, 0.4)' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 className="text-gradient" style={{ fontSize: 30, marginBottom: 10 }}>
                Why AI Scan is Better Than the Parents
              </h2>
              <p className="text-secondary">
                A true hybrid uniting the strengths of both platforms while eliminating subscription traps.
              </p>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>GPTZero</th>
                    <th>ZeroGPT</th>
                    <th style={{ color: 'var(--accent-light)' }}>AI Scan (Hybrid)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sentence-by-Sentence Highlights</strong></td>
                    <td>✅ Yes</td>
                    <td>⚠️ Basic</td>
                    <td style={{ color: '#86efac' }}><strong>✅ Interactive In-line Tooltips</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Multi-Scale Burstiness (B_sent)</strong></td>
                    <td>⚠️ Perplexity only</td>
                    <td>✅ Yes</td>
                    <td style={{ color: '#86efac' }}><strong>✅ Sentence + Clause + Para Variance</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Pricing Model</strong></td>
                    <td>❌ $15–$30/mo Sub</td>
                    <td>❌ $10/mo Sub</td>
                    <td style={{ color: '#86efac' }}><strong>✅ Free Heuristics / Wholesale BYOK</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Multi-Model OpenRouter OAuth</strong></td>
                    <td>❌ No</td>
                    <td>❌ No</td>
                    <td style={{ color: '#86efac' }}><strong>✅ 1-Click PKCE (GPT-4o, Gemini, Claude)</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Local / Python CLI Support</strong></td>
                    <td>❌ Proprietary</td>
                    <td>❌ Proprietary</td>
                    <td style={{ color: '#86efac' }}><strong>✅ Open Source Python CLI + Script</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Zero-Data Retention Privacy</strong></td>
                    <td>⚠️ Terms apply</td>
                    <td>⚠️ Cloud cached</td>
                    <td style={{ color: '#86efac' }}><strong>✅ 100% In-Memory Processing</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, marginBottom: 12 }}>
                Comprehensive Detection Features
              </h2>
              <p className="text-secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
                Every metric you need to authenticate text with total clarity and zero black-box obscurity.
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
                Common questions about AI Scan, our hybrid methodology, and OpenRouter OAuth.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  How does AI Scan combine GPTZero and ZeroGPT?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  AI Scan combines GPTZero&apos;s multi-model perplexity and sentence-by-sentence interactive highlighting with ZeroGPT&apos;s multi-scale sentence length burstiness (B_sent), clause rhythm, and Type-Token Ratio vocabulary metrics.
                </p>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  Can I use AI Scan for free without an OpenRouter key?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Yes! Our ZeroGPT-style heuristic engine runs 100% locally and free in your browser and on our serverless backend with zero API costs.
                </p>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: 17, marginBottom: 8, color: '#f1f5f9' }}>
                  Is my scanned text private and secure?
                </h3>
                <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Yes. Scanned text is processed in-memory during the analysis request and is never logged into a database, retained, or utilized to train machine learning models.
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
                Experience the Next Generation of AI Detection
              </h2>
              <p className="text-secondary" style={{ maxWidth: 500, margin: '0 auto 28px', fontSize: 16 }}>
                Try the live web scanner or connect your OpenRouter account in seconds.
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
            &copy; 2026 AI Scan. Built with OpenRouter OAuth &middot; All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }} className="text-secondary">
            <Link href="/scan" className="text-link">Scanner</Link>
            <Link href="/comparison" className="text-link">Comparison</Link>
            <Link href="/dashboard" className="text-link">Dashboard</Link>
            <Link href="/settings" className="text-link">Settings</Link>
            <a href="/llms.txt" target="_blank" className="text-link">llms.txt</a>
          </div>
        </div>
      </footer>
    </>
  )
}