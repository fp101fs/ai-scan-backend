# 🔬 AI Scan — Hybrid ML Detection Methodology (GPTZero + ZeroGPT Signal Fusion)

> **Mathematical Specification, Algorithmic Breakdown, and Architecture Documentation**

---

## 📌 Executive Summary

The AI text detection engine mathematically fuses **GPTZero-style multi-model perplexity** and **ZeroGPT-style multi-scale burstiness & stylometrics** through a trained binary meta-classifier.

No external detection APIs (GPTZero, ZeroGPT) are called. All calculations run locally with open causal language models and standard Python ML libraries, paired with our OpenRouter BYOK Vercel platform.

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

## 1. Multi-Model Perplexity Signal (GPTZero-Style)

### 1.1 Autoregressive Loss & Perplexity
Perplexity measures how 'surprised' a causal language model $M_j$ is when evaluating a sequence of tokens $t = (t_1, t_2, \dots, t_n)$:

$$\text{Loss}_{M_j}(t) = -\frac{1}{n} \sum_{i=1}^n \log P_{M_j}(t_i \mid t_{<i})$$

$$\text{PPL}_{M_j}(t) = \exp\left(\text{Loss}_{M_j}(t)\right)$$

For long texts exceeding the model's context window, a sliding-window stride formulation is applied:
$$\text{PPL}_{\text{windowed}} = \exp\left(\frac{\sum_w \text{Loss}_w \cdot \text{len}_w}{\sum_w \text{len}_w}\right)$$

### 1.2 Calibration & Log-Perplexity Normalization
Log-perplexity values $\log(\text{PPL})$ are standardized against empirical calibration parameters $(\mu_j, \sigma_j)$:

$$Z_j = \frac{\log(\text{PPL}_j) - \mu_j}{\sigma_j}$$

Because AI-generated text exhibits lower perplexity (negative $Z_j$), we compute the model's AI probability signal via sigmoid transfer:

$$P_{M_j} = \frac{1}{1 + \exp(1.5 \cdot Z_j)}$$

### 1.3 Ensemble Score $P_{\text{ens}}$
Across $K$ open causal LMs (e.g. `gpt2`, `distilgpt2`, `meta-llama/Llama-3.1-8B`, `mistralai/Mistral-7B-v0.3`):

$$P_{\text{ens}} = \sum_{j=1}^K w_j \cdot P_{M_j}, \quad \text{where } \sum_{j=1}^K w_j = 1$$

---

## 2. Multi-Scale Burstiness Signal (ZeroGPT-Style)

Burstiness measures the temporal clustering and structural variation of text. Humans write with diverse rhythm—short punchy sentences alternating with elaborate clauses. LLMs produce uniform sentence lengths with low variance.

### 2.1 Sentence-Level Burstiness Coefficient ($B_{\text{sent}}$)
Given sentence word lengths $L = \{l_1, l_2, \dots, l_k\}$:

$$\mu_L = \frac{1}{k}\sum_{i=1}^k l_i, \quad \sigma_L = \sqrt{\frac{1}{k}\sum_{i=1}^k (l_i - \mu_L)^2}$$

$$B_{\text{sent}} = \frac{\sigma_L - \mu_L}{\sigma_L + \mu_L} \in [-1, +1]$$

- $B_{\text{sent}} \approx -1$: Extreme syntactic uniformity ($\sigma_L \approx 0$), strong AI indicator.
- $B_{\text{sent}} > 0$: High sentence length variance ($\sigma_L > \mu_L$), human writing pattern.

### 2.2 Clause-Level Burstiness ($B_{\text{clause}}$)
Evaluates lengths of sub-clauses separated by commas, semicolons, dashes, and colons $C = \{c_1, \dots, c_m\}$:

$$B_{\text{clause}} = \frac{\sigma_C - \mu_C}{\sigma_C + \mu_C}$$

### 2.3 Paragraph-Level Variance ($B_{\text{para}}$)
Measures the variation of mean sentence lengths across paragraphs $P = \{\bar{l}_{p1}, \bar{l}_{p2}, \dots\}$:

$$B_{\text{para}} = \frac{\sigma_P}{\mu_P + 10^{-5}}$$

### 2.4 Composite Burstiness ($B_{\text{comp}}$)
$$B_{\text{comp}} = 0.50 \cdot B_{\text{sent}} + 0.30 \cdot B_{\text{clause}} + 0.20 \cdot \min(1.0, B_{\text{para}})$$

---

## 3. Stylometric & Lexical Markers

### 3.1 Vocabulary Diversity (Type-Token Ratio)
$$\text{TTR} = \frac{\text{Unique Tokens}}{\text{Total Tokens}}$$
$$\text{Root-TTR} = \frac{\text{Unique Tokens}}{\sqrt{\text{Total Tokens}}}$$

### 3.2 Passive Voice Ratio
Calculates frequency of passive verbal constructions (`is|are|was|were|been|being + past participle`) per sentence:
$$\text{Passive Ratio} = \frac{\text{Passive Constructions}}{\text{Total Sentences}}$$

### 3.3 N-Gram Repetition Ratio
Calculates the fraction of repeated 3-grams and 4-grams:
$$\text{Repetition}_n = \frac{\text{Total } n\text{-grams} - \text{Unique } n\text{-grams}}{\text{Total } n\text{-grams}}$$

### 3.4 AI Transition Cliché Density
Scans for characteristic LLM connector phrases (*furthermore*, *moreover*, *in conclusion*, *to summarize*, *it is important to note*, *delve into*, *testament to*, *tapestry*, *seamlessly*, *bustling*, *paramount*, *plays a crucial role*, *not only... but also*):

$$\text{Density} = \frac{\text{Matches}}{\text{Total Words}} \times 100$$

---

## 4. Meta-Classifier & Feature Assembly

### 4.1 Feature Vector Representation
Each text document or sentence is mapped to the feature vector:
$$x = [P_{\text{ens}}, B_{\text{comp}}, B_{\text{sent}}, B_{\text{clause}}, B_{\text{para}}, \text{TTR}, \text{RootTTR}, \text{PassiveRatio}, \text{TrigramRep}, \text{FourgramRep}, \text{AIPhraseDensity}, \text{AvgWordLen}, \text{PunctDensity}, \mu_L]$$

### 4.2 Meta-Classifier Formulation
A regularized binary classifier ($L_2$ Logistic Regression or Gradient Boosted Trees) maps $x$ to the posterior probability $P(y = 1 \mid x)$:

$$P(y = 1 \mid x) = \frac{1}{1 + \exp\left(-\left(w^T \tilde{x} + b\right)\right)}$$

where $\tilde{x} = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$ is the standardized feature vector.

---

## 5. Output Granularity

1. **Document-Level Score**:
   - $P_{\text{doc}} \in [0.0, 1.0]$
   - Classification Verdicts:
     - $\ge 70\%$: Entirely AI-Generated
     - $45\% - 69\%$: Mixed / AI-Assisted Content
     - $< 45\%$: Likely Human-Written
2. **Sentence-Level Score**:
   - Evaluates each sentence $s_i$ independently using local perplexity and sub-clause variance.
   - Highlights sentences with $P(s_i) \ge \text{threshold}$ as `[AI-LIKELY]`.

---

## 6. CLI Execution

```bash
# Detect single file with sentence highlighting
python3 ai_detector.py detect --file data/ai/sample1.txt --threshold 0.60

# Train on custom datasets
python3 ai_detector.py train --human-dir data/human --ai-dir data/ai --output-dir models

# Batch processing
python3 ai_detector.py batch --input data/batch_test.txt --output data/batch_results.json
```
