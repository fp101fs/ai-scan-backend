import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth'

interface Stat {
  label: string
  value: string
}

interface ScanRecord {
  url: string
  date: string
  aiScore: number
  paragraphs: number
  mode: string
}

const stats: Stat[] = [
  { label: 'Total Scans', value: '247' },
  { label: 'AI Detected', value: '89' },
  { label: 'Human Content', value: '158' },
  { label: 'Accuracy Rate', value: '94.2%' },
]

const recentScans: ScanRecord[] = [
  {
    url: 'blog.example.com/ai-trends',
    date: 'Jul 28, 2026',
    aiScore: 87,
    paragraphs: 14,
    mode: 'openrouter',
  },
  {
    url: 'medium.com/tech-article',
    date: 'Jul 27, 2026',
    aiScore: 18,
    paragraphs: 22,
    mode: 'hybrid',
  },
  {
    url: 'news.site/opinion-piece',
    date: 'Jul 25, 2026',
    aiScore: 65,
    paragraphs: 9,
    mode: 'openrouter',
  },
  {
    url: 'docs.developer.io/guide',
    date: 'Jul 24, 2026',
    aiScore: 12,
    paragraphs: 31,
    mode: 'heuristic',
  },
  {
    url: 'substack.com/essay-draft',
    date: 'Jul 20, 2026',
    aiScore: 78,
    paragraphs: 17,
    mode: 'hybrid',
  },
]

export default async function DashboardPage() {
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
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <header className="flex-between" style={{ marginBottom: 40, borderBottom: '1px solid rgba(99, 102, 241, 0.15)', paddingBottom: 24 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 32, marginBottom: 4 }}>
            Dashboard
          </h1>
          <p className="text-secondary" style={{ fontSize: 15 }}>
            Welcome back, <strong>{session.user?.name || session.user?.email}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/scan" className="btn btn-secondary">
            Web Scanner
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            Settings
          </Link>
          <Link href="/api/auth/signout" className="btn btn-secondary">
            Sign Out
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <section style={{ marginBottom: 48 }}>
        <div className="card-grid-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card animate-slide-up">
              <p className="text-gradient" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
                {stat.value}
              </p>
              <p className="text-secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Scans Table */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="text-gradient" style={{ fontSize: 22, marginBottom: 20 }}>
          Recent Scans
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Date</th>
                <th>AI Score</th>
                <th>Paragraphs</th>
                <th>Detection Mode</th>
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

      {/* Quick Actions */}
      <section>
        <h2 className="text-gradient" style={{ fontSize: 22, marginBottom: 20 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/scan" className="btn btn-primary">
            Launch Text Scanner
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            Configure API Settings
          </Link>
        </div>
      </section>
    </div>
  )
}