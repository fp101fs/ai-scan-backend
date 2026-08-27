# AI Scan — Product Hunt Launch & Go-To-Market Kit

> **Complete launch kit, OpenRouter OAuth PKCE architecture guide, SEO & structured data verification, security audit, and promotional distribution copy for AI Scan.**

---

## 📋 1. Product Hunt Launch Checklist & To-Do Status

- [x] **Primary Auth & Inference**: Integrated 1-click **OpenRouter OAuth (PKCE S256)** flow as the primary authentication & wholesale inference provider ([OpenRouter OAuth Guide](https://openrouter.ai/docs/guides/overview/auth/oauth)).
- [x] **Dual-Engine Fusion**: Mathematical signal fusion combining multi-model LLM verification (GPT-4o Mini, Gemini 2.5 Flash, DeepSeek V3, Claude 3.5 Haiku) with offline burstiness variance ($B_{\text{sent}}$) and Type-Token Ratio (TTR).
- [x] **Deep-Linked Usage & Logs**: SHA-256 API key hashing linking user dashboard directly to OpenRouter logs (`https://openrouter.ai/logs?api_key_hash=...`) and key limit settings.
- [x] **Interactive Web Scanner**: Clean UI featuring sentence-by-sentence color highlighting (Red for AI, Amber for Mixed, Green for Human), interactive hover tooltips, and copyable reports.
- [x] **SEO & Social Meta Tags**: Configured OpenGraph 1200x630 banners, Twitter summary cards, canonical URLs, and dynamic page titles.
- [x] **Schema.org Structured Data**: JSON-LD `WebApplication` and `FAQPage` markup injected directly in `app/layout.tsx`.
- [x] **LLMs.txt Standard**: Verified `/llms.txt` and `/llms-full.txt` endpoints for AI crawlers, search agents, and automated consumption.
- [x] **Security & Privacy Audit**: In-memory evaluation with 100% zero-data retention, secure cookie flags (`httpOnly`, `sameSite: lax`, `secure`), and strict input validation.
- [x] **Documentation**: Up-to-date `README.md`, `METHODOLOGY.md`, and technical specifications.
- [x] **Reddit Outreach Campaign**: 2 active, un-archived discussion targets with tailored, non-spam value-first comment drafts.

---

## 🔑 2. OpenRouter OAuth (PKCE) Architecture

AI Scan implements the official OpenRouter OAuth PKCE specification (`lib/openrouter.ts` & `app/api/auth/openrouter/`):

```
┌──────────────┐                 ┌─────────────────────┐                 ┌───────────────────┐
│ User Browser │                 │   AI Scan Backend   │                 │   OpenRouter API  │
└──────┬───────┘                 └──────────┬──────────┘                 └─────────┬─────────┘
       │                                    │                                      │
       │ 1. Click "Connect OpenRouter"      │                                      │
       │───────────────────────────────────>│                                      │
       │                                    │ 2. Generate code_verifier            │
       │                                    │    & SHA-256 code_challenge          │
       │ 3. Redirect to OpenRouter Auth     │                                      │
       │<───────────────────────────────────│                                      │
       │                                                                           │
       │ 4. Authorize Application                                                  │
       │──────────────────────────────────────────────────────────────────────────>│
       │                                                                           │
       │ 5. Redirect back with ?code=...                                           │
       │<──────────────────────────────────────────────────────────────────────────│
       │                                                                           │
       │ 6. Forward code to /api/auth/openrouter/callback                          │
       │───────────────────────────────────>│                                      │
       │                                    │ 7. POST /api/v1/auth/keys            │
       │                                    │    with code + code_verifier         │
       │                                    │─────────────────────────────────────>│
       │                                    │                                      │
       │                                    │ 8. Returns api_key                   │
       │                                    │<─────────────────────────────────────│
       │                                    │                                      │
       │                                    │ 9. Fetch key info & usage            │
       │                                    │    Compute SHA-256 key hash          │
       │                                    │    Encode NextAuth JWT Session       │
       │ 10. Redirect to /dashboard         │                                      │
       │<───────────────────────────────────│                                      │
```

### Endpoints
- `GET /api/auth/openrouter/login`: Initiates PKCE challenge and redirects to OpenRouter.
- `GET /api/auth/openrouter/callback`: Exchanges auth code for API key and sets secure session cookie.
- `POST /api/auth/openrouter/exchange`: Programmatic token exchange for the Chrome Extension and API clients.
- `POST /api/scan`: Analyzes text paragraphs using OpenRouter multi-model LLM completions or offline heuristics.

---

## 🚀 3. Product Hunt Launch Kit

### General Information
- **Product Name**: AI Scan
- **Tagline**: Open AI detector powered by OpenRouter OAuth & Stylometrics
- **Topics / Categories**: Artificial Intelligence, Writing Tools, Open Source, Developer Tools, Productivity
- **Website URL**: https://ai-scan-backend.vercel.app
- **Repository URL**: https://github.com/fp101fs/ai-scan-backend

### Short Description (250 chars)
> The open, transparent AI content detector. Fuses GPTZero-style perplexity & sentence highlights with ZeroGPT-style burstiness. Connect your OpenRouter account via 1-click OAuth (BYOK) for wholesale ~$0.0001/scan with zero subscription lock-in.

### Maker Story / First Comment
```markdown
👋 Hey Product Hunt community!

I’m excited to share **AI Scan** — an open, transparent, and developer-friendly alternative to subscription-gated AI detectors.

### ❓ The Problem
Most AI detectors today charge $15–$30/month subscriptions for simple heuristics while hiding behind black-box percentage scores that trigger frustrating false positives without explanation.

### 💡 What Makes AI Scan Different?
1. **OpenRouter OAuth (BYOK)**: Connect your OpenRouter account in 1 click using secure PKCE OAuth. Pay actual wholesale inference costs (~$0.0001/scan) with zero subscription markup.
2. **Dual-Signal Hybrid Analysis**: Combines **GPTZero-style multi-model perplexity & sentence-by-sentence highlighting** with **ZeroGPT-style multi-scale burstiness ($B_{\text{sent}}$)**.
3. **100% Zero-Data Retention**: Scanned text is evaluated strictly in-memory. Nothing is stored in databases, logged, or used to train models.
4. **Free Offline Heuristic Engine**: Don't want to use an API key? The offline engine runs locally in your browser using pure statistical stylometrics at zero cost.
5. **Chrome Extension & Python CLI**: Scan full articles and websites on-the-fly, or run batch dataset analysis via Python.

We’d love for you to test the live scanner (no login or credit card required) and share your feedback! 🚀
```

---

## 💬 4. Reddit Promotion & Outreach Strategy

### Target Thread 1: `r/ChatGPT`
- **Focus**: Discussion around AI detector false positives and high subscription prices.
- **Comment Draft**:
> "The biggest issue with commercial AI detectors like Turnitin or GPTZero is that they act like opaque black boxes while charging recurring monthly subscriptions.
>
> If you look at the underlying math, human writing differs from LLMs mainly in **burstiness** (the variance and coefficient of variation in sentence/clause lengths) and **perplexity** (predictability of next-token sequences).
>
> We open-sourced a transparent hybrid scanner called **AI Scan** ([ai-scan-backend.vercel.app](https://ai-scan-backend.vercel.app)) that calculates $B_{\text{sent}}$ burstiness and Type-Token Ratio locally for free, or lets you connect your OpenRouter account via 1-click OAuth (PKCE) so you pay direct wholesale (~$0.0001 per scan) instead of $20/mo subscriptions. It gives you interactive sentence-by-sentence highlights so you can inspect exactly what triggered the score. Zero text retention as well."

---

### Target Thread 2: `r/OpenRouter` / `r/ArtificialInteligence`
- **Focus**: Community discussions on BYOK tools, OpenRouter utility apps, and avoiding SaaS markup.
- **Comment Draft**:
> "If you're already using OpenRouter for completions and coding, you can now use your existing credit balance for AI content detection without paying for separate SaaS subscriptions.
>
> We built **AI Scan** ([ai-scan-backend.vercel.app](https://ai-scan-backend.vercel.app)), which implements OpenRouter's 1-click OAuth PKCE flow. It combines multi-model verification (GPT-4o Mini, Gemini 2.5 Flash, Claude 3.5) with local ZeroGPT-style burstiness variance ($B_{\text{sent}}$) and in-line sentence highlighting.
>
> Each scan costs ~$0.0001 directly against your OpenRouter key, and you can deep-link right to your OpenRouter generation logs. It also works 100% offline using client-side stylometrics if you don't want to connect a key."

---

## 🔍 5. SEO & Structured Data Reference

- **Dynamic Sitemap**: [`app/sitemap.ts`](/app/sitemap.ts)
- **Robots Policy**: [`app/robots.ts`](/app/robots.ts)
- **JSON-LD Schema**: [`app/layout.tsx`](/app/layout.tsx) (`schema.org/WebApplication` & `schema.org/FAQPage`)
- **LLM Manifest**: [`public/llms.txt`](/public/llms.txt) & [`public/llms-full.txt`](/public/llms-full.txt)
