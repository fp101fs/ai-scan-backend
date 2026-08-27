import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | AI Scan',
  description: 'AI Scan Terms of Service: Acceptable use guidelines, statistical detection disclaimers, and OpenRouter BYOK billing terms.',
}

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#1f2937', fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' }}>
      {/* Header Navigation */}
      <nav style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '13px' }}>
            AI
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>AI Scan</span>
        </Link>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/scan" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', textDecoration: 'none' }}>
            Scanner
          </Link>
          <Link href="/privacy" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/scan" style={{ padding: '8px 18px', borderRadius: '9999px', backgroundColor: '#111827', color: 'white', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Launch Detector
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb' }}>
            Legal &amp; Terms
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginTop: '8px', marginBottom: '12px' }}>
            Terms of Service
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            Last Updated: August 27, 2026 &middot; Effective Date: August 27, 2026
          </p>
        </div>

        <div style={{ lineHeight: 1.75, fontSize: '1rem', color: '#374151' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using AI Scan (the &ldquo;Service&rdquo;), including our web application, Chrome Extension, and API endpoints, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use immediately.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              2. Nature of AI Content Detection (Probabilistic Disclaimer)
            </h2>
            <p style={{ marginBottom: '12px' }}>
              AI Scan provides statistical and machine-learning assessments of text predictability, including <strong>Perplexity Analysis</strong>, <strong>Multi-Scale Burstiness</strong>, and <strong>LLM Verifier Inferences</strong>:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li><strong>Probabilistic Nature:</strong> AI detection is inherently statistical and probabilistic. Scores represent likelihood indicators, not absolute mathematical proof of authorship.</li>
              <li><strong>No Sole-Basis Disciplinary Action:</strong> AI Scan is designed as an editorial assistant and verification tool. Detection scores should never serve as the sole ground for punitive, disciplinary, academic expulsion, or employment termination actions without independent corroboration.</li>
              <li><strong>Evolving AI Models:</strong> As generative language models continue to evolve, statistical markers change over time. AI Scan continuously updates detection heuristics but does not guarantee 100% detection of all future unreleased model variants.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              3. User Intellectual Property &amp; Content Rights
            </h2>
            <p>
              <strong>You retain 100% ownership and copyright</strong> of all documents, essays, articles, and text you submit to AI Scan. Because we operate a strict Zero-Data Retention architecture, your submitted content is processed solely in-memory for the duration of the scan and is never retained, claimed, or sublicensed by AI Scan.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              4. OpenRouter BYOK (Bring Your Own Key) &amp; Billing
            </h2>
            <p style={{ marginBottom: '12px' }}>
              AI Scan provides an open Bring-Your-Own-Key model via OpenRouter OAuth:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li>Model inference calls are billed directly to your OpenRouter account at direct provider rates (e.g., ~$0.15 / 1M tokens for GPT-4o Mini).</li>
              <li>AI Scan charges no additional surcharge, subscription fee, or per-token markup on BYOK inference calls.</li>
              <li>You are responsible for managing your OpenRouter account credit balances, spending limits, and API credential security.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              5. Acceptable Use Policy
            </h2>
            <p style={{ marginBottom: '12px' }}>
              You agree not to use AI Scan for:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li>Launching automated denial-of-service (DDoS) attacks or deliberately exhausting server resources.</li>
              <li>Attempting to reverse-engineer, decompile, or exploit backend API endpoints beyond fair programmatic usage limits.</li>
              <li>Scanning illegal, abusive, or non-consensual personal data in violation of applicable privacy regulations.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, AI Scan and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, the detection service or reliance on any detection verdicts.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              7. Contact &amp; Governing Law
            </h2>
            <p>
              These Terms shall be governed by the laws of the State of Delaware, United States. For inquiries regarding these Terms, please contact:
            </p>
            <div style={{ marginTop: '12px', padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <strong>AI Scan Legal Department</strong><br />
              Email: <a href="mailto:legal@kromio.ai" style={{ color: '#2563eb' }}>legal@kromio.ai</a><br />
              Website: <a href="https://ai-scan-backend.vercel.app" style={{ color: '#2563eb' }}>ai-scan-backend.vercel.app</a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: '#9ca3af', padding: '36px 20px', textAlign: 'center', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link>
          <Link href="/scan" style={{ color: '#9ca3af', textDecoration: 'none' }}>Scanner</Link>
          <Link href="/comparison" style={{ color: '#9ca3af', textDecoration: 'none' }}>Comparison</Link>
          <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
        <p style={{ margin: 0, color: '#6b7280' }}>© 2026 AI Scan. Zero Data Retention Architecture.</p>
      </footer>
    </div>
  )
}
