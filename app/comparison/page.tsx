import Link from 'next/link'
import type { Metadata } from 'next'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'AIDetector.buzz vs GPTZero vs ZeroGPT — Technical Comparison & Architecture',
  description:
    'A deep technical breakdown comparing how GPTZero, ZeroGPT, and AIDetector.buzz detect AI-generated text, their underlying algorithms, and architectural differences.',
}

export default function ComparisonPage() {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Breadcrumb / Top Bar */}
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/" className="text-link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            &larr; Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 8 }}>
            <img src="/buzz.png" alt="AIDetector.buzz" style={{ width: 32, height: 32, borderRadius: 6 }} />
            <h1 className="text-gradient" style={{ fontSize: 32, margin: 0 }}>
              AIDetector.buzz vs GPTZero vs ZeroGPT
            </h1>
          </div>
          <p className="text-secondary" style={{ fontSize: 16, maxWidth: 760 }}>
            How commercial AI detectors actually work under the hood, whether they use LLMs, and how AIDetector.buzz fuses both methodologies into an open, transparent platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/scan" className="btn btn-primary btn-sm">
            Launch Scanner
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Direct Comparison Table */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="text-gradient" style={{ fontSize: 24, marginBottom: 16 }}>
          ⚡ Side-by-Side Architectural Breakdown
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Feature / Metric</th>
                <th>GPTZero</th>
                <th>ZeroGPT</th>
                <th style={{ color: 'var(--accent-light)' }}>AIDetector.buzz (Hybrid Fusion)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Detection Signal</strong></td>
                <td>Small Causal Transformer Perplexity</td>
                <td>DeepAnalyse Heuristics &amp; Variance</td>
                <td style={{ color: '#86efac' }}><strong>Hybrid: Multi-Model PPL + Multi-Scale Burstiness</strong></td>
              </tr>
              <tr>
                <td><strong>Uses Chatbot Prompts?</strong></td>
                <td>❌ No (Runs token loss)</td>
                <td>❌ No (No LLM)</td>
                <td>⚙️ <strong>Optional OpenRouter BYOK (Ensemble Layer)</strong></td>
              </tr>
              <tr>
                <td><strong>Burstiness Formulation</strong></td>
                <td>Perplexity variance across sentences</td>
                <td>Sentence length variance</td>
                <td style={{ color: '#86efac' }}><strong>Sentence (B_sent) + Clause (B_clause) + Paragraph Variance</strong></td>
              </tr>
              <tr>
                <td><strong>In-Line Sentence Highlighting</strong></td>
                <td>✅ Yes (Static highlight)</td>
                <td>⚠️ Basic text blocks</td>
                <td style={{ color: '#86efac' }}><strong>✅ Interactive In-line Tooltips &amp; Probabilities</strong></td>
              </tr>
              <tr>
                <td><strong>Offline / Zero-Cost Mode</strong></td>
                <td>❌ Requires subscription</td>
                <td>❌ Cloud only</td>
                <td style={{ color: '#86efac' }}><strong>✅ 100% Free Local Heuristics (0 API Cost)</strong></td>
              </tr>
              <tr>
                <td><strong>Pricing &amp; Monetization</strong></td>
                <td>❌ $15–$30/month Subscription</td>
                <td>❌ $10/month Subscription</td>
                <td style={{ color: '#86efac' }}><strong>✅ Free Heuristics / Direct BYOK ($0.0001/scan)</strong></td>
              </tr>
              <tr>
                <td><strong>Open-Source Local Python CLI</strong></td>
                <td>❌ Closed source</td>
                <td>❌ Closed source</td>
                <td style={{ color: '#86efac' }}><strong>✅ Full Python CLI &amp; Trainable Classifier</strong></td>
              </tr>
              <tr>
                <td><strong>Privacy &amp; Data Retention</strong></td>
                <td>⚠️ Stored in cloud</td>
                <td>⚠️ Cached in cloud</td>
                <td style={{ color: '#86efac' }}><strong>✅ 100% In-Memory (Zero Text Retention)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep Dive Section 1: GPTZero */}
      <section className="glass-card" style={{ marginBottom: 32, padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🔬</span>
          <h2 style={{ fontSize: 24, margin: 0 }}>1. How GPTZero Works Under the Hood</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          A common misconception is that GPTZero &ldquo;asks&rdquo; ChatGPT or an AI chatbot whether a text was generated by AI. <strong>It does not.</strong>
        </p>
        <p className="text-secondary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          Instead, GPTZero uses a <strong>small open causal language model (originally GPT-2 / RoBERTa / custom transformer)</strong> as a mathematical token probability calculator:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
          <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-input)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>Perplexity Evaluation</h3>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              It passes the input text through the neural network layer by layer to measure how &ldquo;surprised&rdquo; the model is by each subsequent token. Because LLMs select statistically predictable tokens, AI text produces consistently <strong>low perplexity</strong>.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-input)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>Burstiness Variance</h3>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              It tracks how much that perplexity spikes or drops from sentence to sentence. Human writing has high perplexity spikes (sudden unexpected words or idioms), while AI maintains a flat perplexity baseline.
            </p>
          </div>
        </div>
      </section>

      {/* Deep Dive Section 2: ZeroGPT */}
      <section className="glass-card" style={{ marginBottom: 32, padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <h2 style={{ fontSize: 24, margin: 0 }}>2. How ZeroGPT Works Under the Hood</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          <strong>ZeroGPT does NOT use an LLM at all for its core detection engine.</strong>
        </p>
        <p className="text-secondary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          ZeroGPT relies on proprietary statistical &amp; stylometric heuristics (marketed as <em>DeepAnalyse Technology</em>):
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
          <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-input)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>Sentence-Length Variance</h3>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Measures the standard deviation vs mean of sentence word lengths (Burstiness = (std - mean) / (std + mean)). AI models generate uniform sentence structures; humans vary length drastically.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-input)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>Lexical Entropy (TTR)</h3>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Calculates the Type-Token Ratio (unique words divided by total words). AI models often maintain narrow lexical repetition.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-input)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>AI Transition Markers</h3>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Scans for stereotypical connective templates (&ldquo;furthermore&rdquo;, &ldquo;moreover&rdquo;, &ldquo;in conclusion&rdquo;, &ldquo;testament to&rdquo;, &ldquo;tapestry&rdquo;).
            </p>
          </div>
        </div>
      </section>

      {/* Deep Dive Section 3: AIDetector.buzz Hybrid Fusion */}
      <section className="glass-card" style={{ marginBottom: 48, padding: '32px', borderColor: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🐝</span>
          <h2 className="text-gradient" style={{ fontSize: 24, margin: 0 }}>3. How AIDetector.buzz Combines the Best of Both</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          <strong>AIDetector.buzz gives you the best of both worlds:</strong> ZeroGPT&apos;s instant, zero-cost mathematical heuristics combined with GPTZero&apos;s multi-model perplexity, interactive sentence highlights, and trained meta-classifier.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="badge badge-human" style={{ marginTop: 2 }}>1</span>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
              <strong>Zero-Cost Offline Heuristics</strong>: Run instant scans on our Vercel serverless backend or Python CLI with $0 API costs, 0 token usage, and 0 external dependencies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="badge badge-human" style={{ marginTop: 2 }}>2</span>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
              <strong>OpenRouter OAuth (BYOK)</strong>: Connect with 1 click via PKCE to cross-verify documents using OpenAI GPT-4o Mini, Google Gemini 2.5 Flash, DeepSeek V3, or Claude 3.5 Haiku at raw wholesale rates with no subscription markup.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="badge badge-human" style={{ marginTop: 2 }}>3</span>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
              <strong>Interactive In-Line Highlighting</strong>: Inspect individual sentences in real document context with hoverable probability badges and word count breakdowns.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="badge badge-human" style={{ marginTop: 2 }}>4</span>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
              <strong>Complete Open-Source Local CLI</strong>: Use <code>ai_detector.py</code> to train custom meta-classifiers on your own calibration datasets or run batch analyses.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section style={{ textAlign: 'center' }}>
        <div
          className="glass-card"
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '40px 28px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
          }}
        >
          <h3 style={{ fontSize: 26, marginBottom: 12 }}>Ready to test the hybrid detector?</h3>
          <p className="text-secondary" style={{ maxWidth: 480, margin: '0 auto 24px', fontSize: 15 }}>
            Paste any text to see real-time sentence highlights and stylometric breakdowns.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/scan" className="btn btn-primary btn-lg">
              Launch Web Scanner Now &rarr;
            </Link>
            <Link href="/scan" className="btn btn-secondary btn-lg">
              Try Sample Essay
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
