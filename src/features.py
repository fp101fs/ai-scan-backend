"""
Feature Extraction and Assembly Module

Combines Perplexity (GPTZero-style), Burstiness (ZeroGPT-style), and Stylometrics
into standardized feature vectors for the Meta-Classifier.
"""

from typing import List, Dict, Tuple, Any
import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

from .perplexity import PerplexityEngine
from .burstiness import BurstinessEngine
from .stylometry import StylometryEngine


FEATURE_NAMES = [
    "ensemble_ppl_prob",    # P_ens: normalized perplexity AI score
    "b_comp",               # Composite burstiness score [-1, 1]
    "b_sent",               # Sentence length burstiness coefficient
    "b_clause",             # Sub-clause length burstiness coefficient
    "b_para",               # Paragraph length variance coefficient
    "ttr",                  # Type-Token Ratio (vocabulary diversity)
    "root_ttr",             # Root-TTR
    "passive_voice_ratio",  # Passive constructions per sentence
    "trigram_repetition",   # 3-gram repetition ratio
    "fourgram_repetition",  # 4-gram repetition ratio
    "ai_phrase_density",    # AI transition clichés per 100 words
    "avg_word_length",      # Average character length per word
    "punctuation_density",  # Punctuation marks per 100 words
    "mean_sentence_len",    # Mean sentence length in words
]


class FeatureExtractor:
    """
    Extracts structured multi-signal feature vectors at document and sentence granularities.
    """

    def __init__(
        self,
        perplexity_engine: PerplexityEngine = None,
        burstiness_engine: BurstinessEngine = None,
        stylometry_engine: StylometryEngine = None,
    ):
        self.perplexity = perplexity_engine or PerplexityEngine()
        self.burstiness = burstiness_engine or BurstinessEngine()
        self.stylometry = stylometry_engine or StylometryEngine()
        self.feature_names = FEATURE_NAMES

    def extract_document_features(self, text: str) -> Tuple[Any, Dict[str, Any]]:
        """
        Extracts document-level feature vector and metadata dictionary.

        Returns:
            Tuple of (feature vector as list/ndarray, structured metadata dict)
        """
        clean_text = text.strip()
        sentences = self.burstiness.split_sentences(clean_text)

        # 1. Perplexity signal
        p_ens, per_model_ppl, raw_ppl = self.perplexity.compute_ensemble_perplexity(clean_text)

        # 2. Burstiness signal
        burst_stats = self.burstiness.analyze(clean_text)

        # 3. Stylometry signal
        stylo_stats = self.stylometry.analyze(clean_text, sentences)

        # Vector assembly
        vector = [
            float(p_ens),
            float(burst_stats["b_comp"]),
            float(burst_stats["b_sent"]),
            float(burst_stats["b_clause"]),
            float(burst_stats["b_para"]),
            float(stylo_stats["ttr"]),
            float(stylo_stats["root_ttr"]),
            float(stylo_stats["passive_voice_ratio"]),
            float(stylo_stats["trigram_repetition"]),
            float(stylo_stats["fourgram_repetition"]),
            float(stylo_stats["ai_phrase_density"]),
            float(stylo_stats["avg_word_length"]),
            float(stylo_stats["punctuation_density"]),
            float(burst_stats["mu_sentence_len"]),
        ]

        feature_array = np.array(vector, dtype=np.float32) if HAS_NUMPY else vector

        metadata = {
            "perplexity": {
                "ensemble_score": round(p_ens, 4),
                "raw_ppl": round(raw_ppl, 2),
                "per_model": {k: round(v, 2) for k, v in per_model_ppl.items()},
            },
            "burstiness": burst_stats,
            "stylometry": stylo_stats,
            "feature_dict": dict(zip(self.feature_names, [round(v, 4) for v in vector])),
            "sentences": sentences,
        }

        return feature_array, metadata

    def extract_sentence_features(self, sentence: str, doc_context: Dict[str, Any] = None) -> Any:
        """
        Extracts feature vector for an individual sentence.
        """
        s_clean = sentence.strip()
        words = self.stylometry.tokenize_words(s_clean)
        word_count = max(1, len(words))

        # Sentence perplexity
        p_ens, _, _ = self.perplexity.compute_ensemble_perplexity(s_clean)

        # Sub-clause burstiness within this single sentence
        clauses = self.burstiness.split_clauses(s_clean)
        clause_lens = [len(self.stylometry.tokenize_words(c)) for c in clauses]
        if len(clause_lens) > 1:
            mu_c = sum(clause_lens) / len(clause_lens)
            var_c = sum((c - mu_c) ** 2 for c in clause_lens) / len(clause_lens)
            b_clause = (math.sqrt(var_c) - mu_c) / (math.sqrt(var_c) + mu_c + 1e-5)
        else:
            b_clause = 0.0

        vocab = self.stylometry.compute_vocabulary_diversity(words)
        passive = self.stylometry.compute_passive_voice_ratio(s_clean, 1)
        trigram_rep = self.stylometry.compute_ngram_repetition(words, n=3)
        fourgram_rep = self.stylometry.compute_ngram_repetition(words, n=4)
        ai_phrases = self.stylometry.compute_ai_phrase_density(s_clean, word_count)

        avg_word_len = sum(len(w) for w in words) / word_count if word_count > 0 else 0.0
        punct_marks = len(self.stylometry.tokenize_words(s_clean))

        vector = [
            float(p_ens),
            float(b_clause * 0.5),
            float(0.0),
            float(b_clause),
            float(0.0),
            float(vocab["ttr"]),
            float(vocab["root_ttr"]),
            float(passive),
            float(trigram_rep),
            float(fourgram_rep),
            float(ai_phrases["density_per_100_words"]),
            float(avg_word_len),
            float((punct_marks / word_count) * 100.0 if word_count > 0 else 0.0),
            float(word_count),
        ]

        return np.array(vector, dtype=np.float32) if HAS_NUMPY else vector
