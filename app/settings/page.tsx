import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth'
import { getOpenRouterKeyInfo, getOpenRouterKeyHash } from '../../lib/openrouter'
import ThemeToggle from '@/components/ThemeToggle'

export default async function SettingsPage() {
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
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/dashboard" className="text-link" style={{ fontSize: 14 }}>
            ← Back to Dashboard
          </Link>
          <h1 className="text-gradient" style={{ marginTop: 8, fontSize: 32 }}>
            API & Detection Settings
          </h1>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: 15 }}>
            Manage your OpenRouter integration, detection defaults, and Chrome extension pairing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/scan" className="btn btn-primary btn-sm">
            Web Scanner
          </Link>
          <Link href="/comparison" className="btn btn-secondary btn-sm">
            Comparison
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="card-grid-2">
        {/* Detection Preferences */}
        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: 18, marginBottom: 20 }}>
            Detection Parameters
          </h3>
          <form>
            <div className="form-group">
              <label className="form-label">Default Detection Engine</label>
              <select className="form-select" defaultValue="hybrid">
                <option value="hybrid">✨ Hybrid (Recommended: 65% AI + 35% Heuristic)</option>
                <option value="openrouter">🤖 OpenRouter AI Direct</option>
                <option value="heuristic">⚡ Offline Heuristics (Zero-Cost)</option>
              </select>
              <span className="form-hint" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Hybrid balances LLM inference with sentence variance and lexical diversity.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default OpenRouter Model</label>
              <select className="form-select" defaultValue="openai/gpt-4o-mini">
                <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Fast & Cost-Effective)</option>
                <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                <option value="deepseek/deepseek-chat">DeepSeek V3 Chat</option>
                <option value="anthropic/claude-3.5-haiku">Anthropic Claude 3.5 Haiku</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">AI Risk Threshold (0.1 - 0.9)</label>
              <input type="number" className="form-input" defaultValue={0.5} step={0.05} min={0.1} max={0.9} />
              <span className="form-hint" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Scores above this value will be flagged as AI-generated in reports.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Max Paragraphs per Request</label>
              <input type="number" className="form-input" defaultValue={50} min={5} max={100} />
            </div>

            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              Save Detection Settings
            </button>
          </form>
        </div>

        {/* OpenRouter & Account Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* OpenRouter OAuth Status */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h3 className="card-title" style={{ fontSize: 18 }}>
                🔑 OpenRouter OAuth (PKCE)
              </h3>
              {isOpenRouterConnected ? (
                <span className="badge badge-human">Connected</span>
              ) : (
                <span className="badge badge-neutral">Not Linked</span>
              )}
            </div>

            <p className="text-secondary" style={{ fontSize: 14, marginBottom: 16 }}>
              Key Label: <strong>{keyLabel}</strong><br />
              Usage: <strong>${usageUsd}</strong> · Limit: <strong>{limitUsd}</strong>
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <a href="/api/auth/openrouter/login" className="btn btn-secondary btn-sm">
                🔄 Re-Authenticate with OpenRouter
              </a>
              {keyHash && (
                <a
                  href={`https://openrouter.ai/keys/${keyHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Manage Key on OpenRouter ↗
                </a>
              )}
            </div>

            <p className="text-muted" style={{ fontSize: 12 }}>
              All scans using your OpenRouter connection are billed directly to your OpenRouter balance at official API rates with zero extra markup.
            </p>
          </div>

          {/* Chrome Extension Status */}
          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>
              🧩 Chrome Extension Integration
            </h3>
            <p className="text-secondary" style={{ fontSize: 14, marginBottom: 12 }}>
              Status: <span className="text-success font-semibold">Active & Synced</span>
            </p>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Your Chrome Extension communicates directly with <code>/api/scan</code> using your active session. No manual API token copying is required.
            </p>
          </div>

          {/* Account Profile */}
          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: 18, marginBottom: 12 }}>
              Account Details
            </h3>
            <p className="text-secondary" style={{ fontSize: 14 }}>
              <strong>Identifier:</strong> {user.name || user.email}
            </p>
            <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
              <strong>Auth Method:</strong> {isOpenRouterConnected ? 'OpenRouter OAuth (PKCE)' : 'Standard Session'}
            </p>

            <Link href="/api/auth/signout" className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
