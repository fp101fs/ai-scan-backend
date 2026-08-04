import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth'

export default async function SettingsPage() {
  let session = null
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    try {
      session = await getServerSession(authOptions)
    } catch {
      session = null
    }
  }

  if (!session) {
    redirect('/')
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <header style={{ marginBottom: 32 }}>
        <Link href="/dashboard" className="text-link" style={{ fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <h1 className="text-gradient" style={{ marginTop: 12, fontSize: 32 }}>
          API & Detection Settings
        </h1>
      </header>

      <div className="card-grid-2">
        {/* Settings Form */}
        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: 18, marginBottom: 20 }}>
            Detection Parameters
          </h3>
          <form>
            <div className="form-group">
              <label className="form-label">Detection Mode</label>
              <select className="form-select" defaultValue="hybrid">
                <option value="openrouter">OpenRouter (AI-powered)</option>
                <option value="heuristic">Heuristic (Offline)</option>
                <option value="hybrid">Hybrid (70% AI / 30% Heuristic)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">OpenRouter API Key (Optional Override)</label>
              <input
                type="password"
                className="form-input"
                placeholder="sk-or-v1-..."
              />
              <span className="form-hint">
                Server key is used by default for signed-in users.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Min Paragraph Words</label>
              <input type="number" className="form-input" defaultValue={20} min={5} max={500} />
            </div>

            <div className="form-group">
              <label className="form-label">Max Paragraphs per Scan</label>
              <input type="number" className="form-input" defaultValue={50} min={5} max={200} />
            </div>

            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
              Save Configuration
            </button>
          </form>
        </div>

        {/* Status & Account Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: 18, marginBottom: 12 }}>
              Extension Connection
            </h3>
            <p className="text-secondary" style={{ fontSize: 14, marginBottom: 16 }}>
              Status: <span className="badge badge-human">Connected & Ready</span>
            </p>
            <p className="text-muted" style={{ fontSize: 13 }}>
              Your Chrome Extension is linked to this account and using server-side proxying.
            </p>
          </div>

          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: 18, marginBottom: 12 }}>
              Account Information
            </h3>
            <p className="text-secondary" style={{ fontSize: 14 }}>
              <strong>Name:</strong> {session.user?.name || 'N/A'}
            </p>
            <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
              <strong>Email:</strong> {session.user?.email || 'N/A'}
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
