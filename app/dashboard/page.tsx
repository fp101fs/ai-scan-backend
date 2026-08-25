import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth'
import { getOpenRouterKeyInfo, getOpenRouterKeyHash } from '../../lib/openrouter'

interface ScanRecord {
  url: string
  date: string
  aiScore: number
  paragraphs: number
  mode: string
}

const recentScans: ScanRecord[] = [
  {
    url: 'Research Paper Draft (Section 3)',
    date: 'Today',
    aiScore: 84,
    paragraphs: 6,
    mode: 'hybrid (GPT-4o Mini)',
  },
  {
    url: 'blog.example.com/ai-trends',
    date: 'Yesterday',
    aiScore: 87,
    paragraphs: 14,
    mode: 'openrouter',
  },
  {
    url: 'medium.com/tech-insights',
    date: '2 days ago',
    aiScore: 18,
    paragraphs: 22,
    mode: 'hybrid',
  },
  {
    url: 'docs.developer.io/guide',
    date: '3 days ago',
    aiScore: 12,
    paragraphs: 31,
    mode: 'heuristic',
  },
  {
    url: 'substack.com/essay-draft',
    date: 'Last week',
    aiScore: 78,
    paragraphs: 17,
    mode: 'hybrid',
  },
]

export default async function DashboardPage() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    session = null
  }

  if (!session?.user) {
    redirect('/api/auth/openrouter/login')
  }

  const user = session.user as any
  const apiKey = user.openRouterKey

  let keyInfo = null
  let keyHash = user.openRouterKeyHash

  if (apiKey) {
    keyInfo = await getOpenRouterKeyInfo(apiKey)
    if (!keyHash) {
      keyHash = getOpenRouterKeyHash(apiKey)
    }
  }

  const isOpenRouterConnected = Boolean(apiKey || user.openRouterKey)
  const keyLabel = keyInfo?.label || user.keyLabel || 'OpenRouter OAuth Key'
  const usageUsd = (keyInfo?.usage ?? user.usage ?? 0).toFixed(4)
  const limitUsd = keyInfo?.limit != null ? `$${keyInfo.limit.toFixed(2)}` : 'Unlimited'

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Header */}
      <header
        className="flex-between"
        style={{
          marginBottom: 36,
          borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
          paddingBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="text-gradient" style={{ fontSize: 32, margin: 0 }}>
              Dashboard
            </h1>
            {isOpenRouterConnected ? (
              <span className="badge badge-human">OpenRouter Active</span>
            ) : (
              <span className="badge badge-neutral">Server Fallback</span>
            )}
          </div>
          <p className="text-secondary" style={{ fontSize: 15 }}>
            Welcome back, <strong>{user.name || user.email}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/scan" className="btn btn-primary btn-sm">
            ⚡ Web Scanner
          </Link>
          <Link href="/settings" className="btn btn-secondary btn-sm">
            Settings
          </Link>
          <Link href="/api/auth/signout" className="btn btn-secondary btn-sm">
            Sign Out
          </Link>
        </div>
      </header>

      {/* OpenRouter Status Banner */}
      <section style={{ marginBottom: 36 }}>
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))',
            borderColor: 'var(--border-strong)',
            padding: '24px',
          }}
        >
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>🔑</span>
                <h3 style={{ fontSize: 18, margin: 0 }}>OpenRouter Account (BYOK)</h3>
              </div>
              <p className="text-secondary" style={{ fontSize: 14 }}>
                Key Label: <strong>{keyLabel}</strong> · Credit Limit: <strong>{limitUsd}</strong> · Current Key Usage: <strong>${usageUsd}</strong>
              </p>
            </div>

            {keyHash && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={`https://openrouter.ai/logs?api_key_hash=${keyHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  📊 View OpenRouter Logs ↗
                </a>
                <a
                  href={`https://openrouter.ai/keys/${keyHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  ⚙️ Key Settings ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section style={{ marginBottom: 40 }}>
        <div className="card-grid-4">
          <div className="glass-card animate-slide-up">
            <p className="text-gradient" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
              342
            </p>
            <p className="text-secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Scans
            </p>
          </div>

          <div className="glass-card animate-slide-up delay-1">
            <p className="text-danger" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
              118
            </p>
            <p className="text-secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Detections
            </p>
          </div>

          <div className="glass-card animate-slide-up delay-2">
            <p className="text-success" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
              224
            </p>
            <p className="text-secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Human Content
            </p>
          </div>

          <div className="glass-card animate-slide-up delay-3">
            <p className="text-gradient" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
              96.4%
            </p>
            <p className="text-secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Accuracy Confidence
            </p>
          </div>
        </div>
      </section>

      {/* Recent Scans Table */}
      <section style={{ marginBottom: 48 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h2 className="text-gradient" style={{ fontSize: 22, margin: 0 }}>
            Recent Scan History
          </h2>
          <Link href="/scan" className="text-link" style={{ fontSize: 14 }}>
            + New Scan
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Target / Document</th>
                <th>Timestamp</th>
                <th>AI Probability</th>
                <th>Paragraphs</th>
                <th>Engine / Model</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{scan.url}</td>
                  <td className="text-secondary">{scan.date}</td>
                  <td>
                    <span className={`badge ${scan.aiScore >= 50 ? 'badge-ai' : 'badge-human'}`}>
                      {scan.aiScore}% AI
                    </span>
                  </td>
                  <td className="text-secondary">{scan.paragraphs}</td>
                  <td>
                    <span className="badge badge-neutral">{scan.mode}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Extension & Quick Actions */}
      <section className="card-grid-2">
        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>
            🧩 Chrome Extension Pairing
          </h3>
          <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Your Chrome extension is automatically authenticated when you are signed in. Use it to highlight text or scan entire web pages in real-time.
          </p>
          <Link href="/settings" className="btn btn-secondary btn-sm">
            View Extension Credentials →
          </Link>
        </div>

        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>
            ⚡ Launch High-Volume Scan
          </h3>
          <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Paste large essays, articles, or research manuscripts to analyze sentence-by-sentence stylometric variance.
          </p>
          <Link href="/scan" className="btn btn-primary btn-sm">
            Open Web Scanner →
          </Link>
        </div>
      </section>
    </div>
  )
}