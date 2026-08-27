import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | AIDetector.buzz',
  description: 'AIDetector.buzz privacy policy: Zero data retention, 100% in-memory processing, and transparent OpenRouter BYOK architecture.',
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#1f2937', fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' }}>
      {/* Header Navigation */}
      <nav style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '13px' }}>
            AI
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>AIDetector.buzz</span>
        </Link>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/scan" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', textDecoration: 'none' }}>
            Scanner
          </Link>
          <Link href="/terms" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', textDecoration: 'none' }}>
            Terms of Service
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
            Legal &amp; Compliance
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginTop: '8px', marginBottom: '12px' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            Last Updated: August 27, 2026 &middot; Effective Date: August 27, 2026
          </p>
        </div>

        <div style={{ lineHeight: 1.75, fontSize: '1rem', color: '#374151' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              1. Zero-Data Retention Architecture
            </h2>
            <p style={{ marginBottom: '12px' }}>
              At AIDetector.buzz, our highest architectural priority is total data privacy. We operate on a strict <strong>Zero Data Retention</strong> policy:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li><strong>100% In-Memory Evaluation:</strong> Any text, essay, article, or document submitted for AI detection is analyzed entirely in volatile memory and immediately purged upon response delivery.</li>
              <li><strong>No Database Storage:</strong> Your submitted texts are never saved, indexed, archived, or stored in any persistent database.</li>
              <li><strong>No AI Model Training:</strong> We never use your submitted content, intellectual property, or personal writing to train, fine-tune, or calibrate any machine learning models.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              2. OpenRouter OAuth &amp; Bring-Your-Own-Key (BYOK)
            </h2>
            <p style={{ marginBottom: '12px' }}>
              AIDetector.buzz integrates directly with OpenRouter via secure Proof Key for Code Exchange (PKCE) OAuth:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li>When you connect your OpenRouter account, your session token or API key is encrypted using AES-GCM and stored only for your authenticated session.</li>
              <li>Inference costs are billed directly by OpenRouter against your existing credit balance with 0% platform markup.</li>
              <li>You may disconnect your OpenRouter key at any time in one click from the <Link href="/settings" style={{ color: '#2563eb', fontWeight: 600 }}>Settings</Link> page, which immediately destroys the active session credential.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              3. Information We Collect
            </h2>
            <p style={{ marginBottom: '12px' }}>
              We minimize data collection to the absolute bare minimum required to deliver the service:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li><strong>Account Credentials:</strong> If you authenticate via OAuth, we receive your basic profile identity (e.g., account handle/email) necessary to manage your BYOK session.</li>
              <li><strong>Technical Diagnostics:</strong> Standard anonymized HTTP request logs (IP address, user agent, response code) retained ephemerally for DDoS mitigation and server error debugging.</li>
              <li><strong>Local Preferences:</strong> Your preferred theme (Dark/Light mode) is stored locally in your browser&apos;s <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>localStorage</code> and is never transmitted to our servers.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              4. Chrome Extension Privacy
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The AIDetector.buzz Chrome Extension operates strictly on user demand:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li>The extension only reads text that you explicitly highlight or submit for scanning.</li>
              <li>It does not record browsing history, track visited URLs, or monitor background keystrokes.</li>
              <li>All communication between the extension and the backend occurs over TLS-encrypted HTTPS endpoints.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              5. Global Privacy Compliance (GDPR, CCPA/CPRA, FERPA)
            </h2>
            <p style={{ marginBottom: '12px' }}>
              AIDetector.buzz complies with global data privacy frameworks:
            </p>
            <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '12px' }}>
              <li><strong>GDPR (EU/EEA):</strong> Right to access, rectify, and erase your account data immediately upon request.</li>
              <li><strong>CCPA / CPRA (California):</strong> We do not sell, rent, or share personal data or submitted text with third-party data brokers.</li>
              <li><strong>FERPA &amp; Academic Privacy:</strong> Student essays and academic papers are never cataloged, guaranteeing institutional compliance.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              6. Contact Us
            </h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to submit a data erasure inquiry, please contact our Data Protection team at:
            </p>
            <div style={{ marginTop: '12px', padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <strong>AIDetector.buzz Data Protection Office</strong><br />
              Email: <a href="mailto:privacy@kromio.ai" style={{ color: '#2563eb' }}>privacy@kromio.ai</a><br />
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
          <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
        <p style={{ margin: 0, color: '#6b7280' }}>© 2026 AIDetector.buzz. Zero Data Retention Architecture.</p>
      </footer>
    </div>
  )
}
