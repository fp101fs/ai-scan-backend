"""
Multi-Scale Burstiness Module (ZeroGPT-Style Signal)

Mathematical Background:
Burstiness measures the intermittent, clustered nature of linguistic patterns.
Humans naturally vary cadence: combining short, punchy declarative fragments with long,
complex subordinate clauses. Conversely, autoregressive LLMs produce syntactically uniform
sentences with narrow length distributions.

Formulas:
1. Sentence Length Distribution: L = {l_1, l_2, ..., l_k}
   Mean: mu_L = (1 / k) * sum(l_i)
   Std Dev: sigma_L = sqrt( (1 / k) * sum((l_i - mu_L)^2) )
   Sentence Burstiness Coefficient:
       B_sent = (sigma_L - mu_L) / (sigma_L + mu_L)
   Bounded in [-1, +1].
   Values near -1 imply extreme uniformity (typical of AI).
   Values > 0 imply strong burstiness (typical of human writers).

2. Clause Length Distribution: C = {c_1, c_2, ..., c_m}
   B_clause = (sigma_C - mu_C) / (sigma_C + mu_C)

3. Paragraph-Level Variance: P = {mean_l_p1, mean_l_p2, ...}
   B_para = sigma_P / (mu_P + 1e-5)

4. Composite Burstiness:
   B_comp = 0.50 * B_sent + 0.30 * B_clause + 0.20 * min(1.0, B_para)
"""

from typing import List, Dict, Tuple
import math
import re


class BurstinessEngine:
    """
    Computes sentence-level, clause-level, paragraph-level, and composite burstiness metrics.
    """

    def __init__(self, min_sentence_words: int = 1):
        self.min_sentence_words = min_sentence_words

    def split_sentences(self, text: str) -> List[str]:
        """
        Split document text into individual sentences using robust regex or punctuation boundaries.
        """
        raw = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'“‘])', text.strip())
        sentences = [s.strip() for s in raw if s.strip()]
        if not sentences and text.strip():
            sentences = [text.strip()]
        return sentences

    def split_paragraphs(self, text: str) -> List[str]:
        """Split document into paragraphs separated by double newlines."""
        paras = re.split(r'\n\s*\n', text.strip())
        return [p.strip() for p in paras if p.strip()]

    def split_clauses(self, sentence: str) -> List[str]:
        """Split a sentence into clauses by commas, semicolons, em-dashes, and colons."""
        clauses = re.split(r'[,;:\—\–\-]', sentence)
        return [c.strip() for c in clauses if len(c.strip().split()) > 0]

    def compute_sentence_burstiness(self, sentences: List[str]) -> Tuple[float, float, float, List[int]]:
        """
        Computes sentence length statistics and the burstiness coefficient B_sent.

        Returns:
            Tuple of (b_sent, mu_L, sigma_L, sentence_lengths)
        """
        lengths = [len(re.findall(r"\b[a-z0-9'-]+\b", s.lower())) for s in sentences]
        lengths = [l for l in lengths if l >= self.min_sentence_words]

        if len(lengths) < 2:
            return 0.0, float(lengths[0]) if lengths else 0.0, 0.0, lengths

        k = len(lengths)
        mu = sum(lengths) / k
        variance = sum((l - mu) ** 2 for l in lengths) / k
        sigma = math.sqrt(variance)

        denom = sigma + mu
        if denom == 0:
            b_sent = -1.0
        else:
            b_sent = (sigma - mu) / denom

        return float(b_sent), float(mu), float(sigma), lengths

    def compute_clause_burstiness(self, sentences: List[str]) -> Tuple[float, float, float]:
        """
        Computes clause length distribution and clause burstiness B_clause.
        """
        clause_lengths = []
        for s in sentences:
            clauses = self.split_clauses(s)
            for c in clauses:
                words = re.findall(r"\b[a-z0-9'-]+\b", c.lower())
                if words:
                    clause_lengths.append(len(words))

        if len(clause_lengths) < 2:
            return 0.0, float(clause_lengths[0]) if clause_lengths else 0.0, 0.0

        m = len(clause_lengths)
        mu = sum(clause_lengths) / m
        variance = sum((c - mu) ** 2 for c in clause_lengths) / m
        sigma = math.sqrt(variance)

        denom = sigma + mu
        b_clause = (sigma - mu) / denom if denom > 0 else -1.0
        return float(b_clause), float(mu), float(sigma)

    def compute_paragraph_burstiness(self, text: str) -> float:
        """
        Computes the variation of mean sentence lengths across paragraphs.
        """
        paras = self.split_paragraphs(text)
        if len(paras) < 2:
            return 0.0

        para_mean_lengths = []
        for p in paras:
            p_sents = self.split_sentences(p)
            lengths = [len(re.findall(r"\b[a-z0-9'-]+\b", s.lower())) for s in p_sents]
            if lengths:
                para_mean_lengths.append(sum(lengths) / len(lengths))

        if len(para_mean_lengths) < 2:
            return 0.0

        n = len(para_mean_lengths)
        mu = sum(para_mean_lengths) / n
        variance = sum((l - mu) ** 2 for l in para_mean_lengths) / n
        sigma = math.sqrt(variance)

        # Coefficient of variation across paragraphs
        cv_para = sigma / (mu + 1e-5)
        return float(cv_para)

    def analyze(self, text: str) -> Dict[str, any]:
        """
        Executes full multi-scale burstiness analysis on document.

        Returns:
            Dictionary with sentence burstiness, clause burstiness, paragraph burstiness,
            composite burstiness score, and normalized AI probability feature.
        """
        sentences = self.split_sentences(text)
        b_sent, mu_sent, sigma_sent, lengths = self.compute_sentence_burstiness(sentences)
        b_clause, mu_clause, sigma_clause = self.compute_clause_burstiness(sentences)
        b_para = self.compute_paragraph_burstiness(text)

        # Composite score
        b_comp = (0.50 * b_sent) + (0.30 * b_clause) + (0.20 * min(1.0, b_para))

        # Convert to AI probability feature: lower burstiness (near -1) -> high AI probability
        # Normalization: map [-1, 0.5] to [0.95, 0.05]
        # Human text usually has B_comp > -0.2; AI text usually has B_comp < -0.5
        norm_ai_prob = 1.0 / (1.0 + math.exp((b_comp + 0.35) * 6.0))

        return {
            "b_sent": round(b_sent, 4),
            "b_clause": round(b_clause, 4),
            "b_para": round(b_para, 4),
            "b_comp": round(b_comp, 4),
            "mu_sentence_len": round(mu_sent, 2),
            "sigma_sentence_len": round(sigma_sent, 2),
            "sentence_count": len(sentences),
            "sentence_lengths": lengths,
            "burstiness_ai_prob": round(float(norm_ai_prob), 4),
        }
