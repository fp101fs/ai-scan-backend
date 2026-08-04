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
    title: 'Real-Time Detection',
    description:
      'Scan pages as you browse. AI Scan analyzes content in real time and flags AI-generated text the moment you land on a page.',
  },
  {
    icon: '🎯',
    title: 'Multiple Detection Modes',
    description:
      'Choose between OpenRouter AI, Heuristic, or Hybrid mode to match your accuracy needs and available budget.',
  },
  {
    icon: '📊',
    title: 'Dashboard Analytics',
    description:
      'Track your scan history and statistics in one place. Review trends, compare results, and export reports anytime.',
  },
]

const steps: Step[] = [
  {
    number: '01',
    title: 'Install Extension',
    description: 'Add AI Scan to your browser in seconds — no configuration required.',
  },
  {
    number: '02',
    title: 'Sign In',
    description: 'Create an account or sign in with Google to sync your scans across devices.',
  },
  {
    number: '03',
    title: 'Start Scanning',
    description: 'Visit any page or paste text, pick a detection mode, and get your score instantly.',
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  const isAuthenticated = Boolean(session?.user)

  return (
    <>
      <header>
        <div className="container flex-between" style={{ padding: '24px 0' }}>
          <h2>
            <span className="text-gradient">AI Scan</span>
          </h2>
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/api/auth/signin" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main>
        <section style={{ padding: '120px 0', textAlign: 'center' }}>
          <div className="container">
            <h1
              className="text-gradient"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              Detect AI-Written Content Instantly
            </h1>
            <p
              className="text-secondary"
              style={{
                maxWidth: 640,
                margin: '0 auto 40px',
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              AI Scan is a Chrome extension that analyzes web pages and pasted text in real time, giving you a clear AI-probability score with detailed breakdowns — right where you browse.
            </p>
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/api/auth/signin" className="btn btn-primary btn-lg">
                Get Started — It's Free
              </Link>
            )}
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="text-gradient" style={{ marginBottom: 32 }}>
              Features
            </h2>
            <div className="card-grid-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card glass-card-interactive animate-slide-up"
                >
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: 16 }}>
                    {feature.icon}
                  </span>
                  <h3 className="card-title" style={{ fontSize: 20, marginBottom: 8 }}>
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

        <section className="section">
          <div className="container">
            <h2 className="text-gradient" style={{ marginBottom: 32 }}>
              How It Works
            </h2>
            <div className="card-grid-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="glass-card glass-card-interactive animate-slide-up"
                >
                  <span
                    className="text-gradient"
                    style={{
                      fontSize: '48px',
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'block',
                      marginBottom: 16,
                    }}
                  >
                    {step.number}
                  </span>
                  <h3 className="card-title" style={{ fontSize: 20, marginBottom: 8 }}>
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
      </main>

      <footer style={{ padding: '40px 0', borderTop: '1px solid rgba(99, 102, 241, 0.15)', marginTop: 80 }}>
        <div className="container flex-between">
          <p className="text-muted" style={{ fontSize: 14 }}>
            © 2026 AI Scan. All rights reserved.
          </p>
          <span className="text-gradient" style={{ fontWeight: 700 }}>
            AI Scan
          </span>
        </div>
      </footer>
    </>
  )
}