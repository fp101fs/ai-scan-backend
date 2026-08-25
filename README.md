# AI Scan — Hybrid ML AI-Text Detector (GPTZero + ZeroGPT Signal Fusion)

[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Launch-orange?style=flat&logo=producthunt)](https://www.producthunt.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-green?logo=python)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-OAuth%20PKCE-purple)](https://openrouter.ai)

> **A hybrid ML AI-text detector that fuses "GPTZero-style" multi-model perplexity with "ZeroGPT-style" multi-scale burstiness and stylometrics, combined with a trained binary meta-classifier. Fully local & OpenRouter BYOK.**

---

## 🧠 Hybrid ML Architecture Overview

The AI text detection engine mathematically fuses **GPTZero-style multi-model perplexity** and **ZeroGPT-style multi-scale burstiness & stylometrics** through a trained binary meta-classifier.

No external detection APIs (GPTZero, ZeroGPT) are called. All calculations run locally with open causal language models and Python ML libraries, paired with our OpenRouter BYOK Vercel platform.

```
                          ┌────────────────────────────────────────────────┐
                          │                   Input Text                   │
                          └───────────────────────┬────────────────────────┘
                                                  │
              ┌───────────────────────────────────┼───────────────────────────────────┐
              │                                   │                                   │
              ▼                                   ▼                                   ▼
┌───────────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
│ Multi-Model Perplexity    │       │ Multi-Scale Burstiness    │       │ Stylometrics & Syntax     │
│ (GPTZero-Style Signal)    │       │ (ZeroGPT-Style Signal)    │       │ (Lexical & Repetition)    │
│                           │       │                           │       │                           │
│ • Causal LM Token Loss    │       │ • Sentence B_sent in [-1,1│       │ • Type-Token Ratio (TTR)  │
│ • PPL = exp(-1/N sum logP)│       │ • Sub-Clause B_clause     │       │ • Passive Voice Ratio     │
│ • Log-PPL Calibrated Z    │       │ • Paragraph Variance B_par│       │ • 3-gram & 4-gram Overlap │
│ • Ensemble Score P_ens    │       │ • Composite B_comp        │       │ • AI Transition Clichés   │
└─────────────┬─────────────┘       └─────────────┬─────────────┘       └─────────────┬─────────────┘
              │                                   │                                   │
              └───────────────────────────────────┼───────────────────────────────────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │      Meta-Classifier      │
                                    │  Logistic / GBDT / Forest │
                                    │    y = P(AI-Generated)    │
                                    └─────────────┬─────────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    ▼                           ▼
                        ┌───────────────────────┐   ┌───────────────────────┐
                        │ Document Probability  │   │ Sentence Probability  │
                        │ Overall Classification│   │ [AI-LIKELY] Markers   │
                        └───────────────────────┘   └───────────────────────┘
```

---

## 📐 Mathematical Methodology & Core Signals

### 1. Multi-Model Perplexity (GPTZero-Style)
For a token sequence $t = (t_1, t_2, \dots, t_n)$ evaluated by causal LM $M_j$:
$$\text{Loss}_{M_j}(t) = -\frac{1}{n} \sum_{i=1}^n \log P_{M_j}(t_i \mid t_{<i})$$
$$\text{PPL}_{M_j}(t) = \exp\left(\text{Loss}_{M_j}(t)\right)$$

Normalized log-perplexity $Z_j = \frac{\log(\text{PPL}_j) - \mu_j}{\sigma_j}$ is mapped to an AI likelihood score $P_{\text{ens}}$. Lower perplexity (predictable next-token patterns) strongly correlates with LLM generation.

### 2. Multi-Scale Burstiness (ZeroGPT-Style)
Measures sentence and clause length clustering. Given sentence lengths $L = \{l_1, \dots, l_k\}$:
$$\mu_L = \frac{1}{k}\sum_{i=1}^k l_i, \quad \sigma_L = \sqrt{\frac{1}{k}\sum_{i=1}^k (l_i - \mu_L)^2}$$
$$B_{\text{sent}} = \frac{\sigma_L - \mu_L}{\sigma_L + \mu_L} \in [-1, +1]$$

- $B_{\text{sent}} \approx -1$: Extreme syntactic uniformity ($\sigma_L \approx 0$), characteristic of AI generation.
- $B_{\text{sent}} > 0$: High rhythmic variance (short declarative sentences mixed with complex clauses), characteristic of human authors.
- Composite burstiness: $B_{\text{comp}} = 0.50 \cdot B_{\text{sent}} + 0.30 \cdot B_{\text{clause}} + 0.20 \cdot B_{\text{para}}$.

### 3. Stylometric Markers
- **Vocabulary Diversity**: Type-Token Ratio $\text{TTR} = \frac{\text{unique\_tokens}}{\text{total\_tokens}}$ and Root-TTR $\frac{\text{unique}}{\sqrt{\text{total}}}$.
- **Passive Voice Ratio**: Frequency of passive constructions per sentence.
- **N-Gram Repetition**: 3-gram and 4-gram repetition fractions.
- **AI Transition Density**: Detection frequency of stereotypical transition templates ("furthermore", "moreover", "in conclusion", "it is important to note", "delve into", "testament to", "tapestry", "seamlessly").

---

## 📁 Implemented Code Structure

```
├── ai_detector.py         # Main executable CLI entrypoint
├── METHODOLOGY.md         # Detailed mathematical formulation & algorithmic breakdown
├── src/
│   ├── perplexity.py      # Multi-model causal LM sliding-window perplexity engine
│   ├── burstiness.py      # ZeroGPT-style multi-scale sentence/clause/paragraph burstiness
│   ├── stylometry.py      # Vocabulary diversity (TTR), passive voice, n-grams & AI phrases
│   ├── features.py        # Assembles standardized feature vectors (doc & sentence level)
│   ├── classifier.py      # Binary meta-classifier (Logistic / GBDT / Forest) with calibration
│   └── cli.py             # CLI commands (detect, train, batch)
├── requirements.txt       # PyTorch, Transformers, Scikit-learn, spaCy
├── data/
│   ├── human/             # Calibration human-written texts
│   └── ai/                # Calibration AI-generated texts
├── lib/
│   └── heuristics.ts      # Synced TypeScript stylometric & burstiness engine
└── app/                   # Next.js 14 web scanner & OpenRouter OAuth backend
```

---

## 💻 CLI Usage Examples

### 1. Document & Sentence-Level Detection
```bash
python3 ai_detector.py detect --file data/ai/sample1.txt --threshold 0.60
```

**Output:**
```text
======================================================================
                      DETECTION REPORT
======================================================================
Overall AI Probability : 100.0% (1.0000)
Classification Verdict : Entirely AI-Generated
----------------------------------------------------------------------
CORE SIGNALS BREAKDOWN:
  • Ensemble Perplexity AI Score : 0.0195 (Raw PPL: 249.72)
  • Composite Burstiness Score   : -0.4860 (Sentence B: -0.8298, Clause B: -0.2369)
  • Vocabulary Diversity (TTR)   : 80.9% (Unique / Total tokens)
  • Passive Voice Ratio          : 0.00 per sentence
  • AI Template Phrase Matches   : 6 detected
======================================================================

SENTENCE-BY-SENTENCE BREAKDOWN (Threshold: 60%):
  [HUMAN]     (  0.0% AI | 16w) The rapid advancement of artificial intelligence represents a pivotal milestone in the evolution of modern technology.
  [HUMAN]     (  0.9% AI | 15w) Large language models seamlessly process vast quantities of textual data to generate contextually relevant outputs.
  [AI-LIKELY] ( 99.3% AI | 18w) Furthermore, it is important to note that these computational architectures play a crucial role in modern productivity workflows.
  [AI-LIKELY] (100.0% AI | 19w) In conclusion, the integration of intelligent automation stands as a testament to human ingenuity in an increasingly digital landscape.
======================================================================
```

### 2. Training Meta-Classifier on Custom Calibration Data
```bash
python3 ai_detector.py train \
  --human-dir data/human \
  --ai-dir data/ai \
  --output-dir models \
  --model-name model.pkl
```

### 3. Batch Analysis
```bash
python3 ai_detector.py batch --input data/batch_test.txt --output data/batch_results.json --threshold 0.60
```

---

## 🌐 Web Platform & OpenRouter OAuth (BYOK)

The web platform (Vercel-hosted) integrates the same stylometric calculations with OpenRouter OAuth (PKCE) for multi-model verification:
- **1-Click OAuth (PKCE)**: Connect your OpenRouter account without copying keys.
- **Multi-Model Support**: Verify using `gpt-4o-mini`, `gemini-2.5-flash`, `deepseek-chat`, or `claude-3.5-haiku`.
- **Zero-Retention**: Scans run in-memory and are never stored or used to train models.

Run the web frontend:
```bash
npm install
npm run dev
```

---

## 📄 License

MIT © 2026 AI Scan Team
