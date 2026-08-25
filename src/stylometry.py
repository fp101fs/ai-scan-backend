"""
Stylometric Feature Extraction Module

Extracts lexical, syntactic, and structural markers that differentiate
human authors from LLM generation:
1. Vocabulary Diversity: Type-Token Ratio (TTR), Root-TTR, and Maas/Herdan Index.
2. Passive Voice Ratio: Passive constructions per sentence.
3. N-gram Repetition: Max 3-gram and 4-gram repetition fractions.
4. AI-ish Phrase Density: Characteristic transition templates and formulaic clichés.
5. Punctuation & Function Word Dynamics.
"""

from typing import List, Dict, Set
import re
import math


DEFAULT_AI_TEMPLATES = [
    r"\bfurthermore\b",
    r"\bmoreover\b",
    r"\bin conclusion\b",
    r"\bto summarize\b",
    r"\bin summary\b",
    r"\bit is important to note\b",
    r"\bit is worth noting\b",
    r"\bdelve(?:s|d|ing)? into\b",
    r"\btestament to\b",
    r"\btapestry\b",
    r"\bbustling\b",
    r"\bparamount\b",
    r"\bseamlessly\b",
    r"\bharnessing the power\b",
    r"\bin today's rapidly (?:evolving|changing)\b",
    r"\bplays a crucial role\b",
    r"\bplays a pivotal role\b",
    r"\bnot only\b.*?\bbut also\b",
    r"\bnavigating the complexities\b",
    r"\bstands as a\b",
    r"\bprofound impact\b",
    r"\bkey takeaway\b",
]

PASSIVE_REGEX = re.compile(
    r"\b(is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en|built|done|made|seen|written|found|given|taken|known)\b",
    re.IGNORECASE,
)


class StylometryEngine:
    """
    Extracts stylometric and syntactic features from document and sentence text.
    """

    def __init__(self, ai_templates: List[str] = None):
        self.ai_templates = [re.compile(p, re.IGNORECASE) for p in (ai_templates or DEFAULT_AI_TEMPLATES)]

    def tokenize_words(self, text: str) -> List[str]:
        """Extract lowercase alphanumeric word tokens."""
        return re.findall(r"\b[a-z0-9'-]+\b", text.lower())

    def compute_vocabulary_diversity(self, words: List[str]) -> Dict[str, float]:
        """
        Computes TTR, Root-TTR, and Log-TTR (Herdan's C).
        """
        total = len(words)
        if total == 0:
            return {"ttr": 0.0, "root_ttr": 0.0, "log_ttr": 0.0}

        unique = len(set(words))
        ttr = unique / total
        root_ttr = unique / math.sqrt(total)
        log_ttr = math.log(unique) / math.log(total) if total > 1 and unique > 1 else 1.0

        return {
            "ttr": round(ttr, 4),
            "root_ttr": round(root_ttr, 4),
            "log_ttr": round(log_ttr, 4),
        }

    def compute_passive_voice_ratio(self, text: str, sentence_count: int) -> float:
        """
        Calculates the frequency of passive voice constructions per sentence.
        """
        if sentence_count == 0:
            return 0.0

        matches = PASSIVE_REGEX.findall(text)
        passive_count = len(matches)
        ratio = passive_count / sentence_count
        return round(float(ratio), 4)

    def compute_ngram_repetition(self, words: List[str], n: int = 3) -> float:
        """
        Calculates the ratio of repeated n-grams over total n-grams.
        Formula: (total_ngrams - unique_ngrams) / total_ngrams
        """
        if len(words) < n:
            return 0.0

        ngrams = [tuple(words[i : i + n]) for i in range(len(words) - n + 1)]
        total_ngrams = len(ngrams)
        if total_ngrams == 0:
            return 0.0

        unique_ngrams = len(set(ngrams))
        rep_ratio = (total_ngrams - unique_ngrams) / total_ngrams
        return round(float(rep_ratio), 4)

    def compute_ai_phrase_density(self, text: str, word_count: int) -> Dict[str, any]:
        """
        Scans text for stereotypical LLM transition markers and template phrases.
        Returns match count, matches list, and density per 100 words.
        """
        if word_count == 0:
            return {"count": 0, "density_per_100_words": 0.0, "matches": []}

        matches_found = []
        for pattern in self.ai_templates:
            found = pattern.findall(text)
            if found:
                matches_found.extend(found if isinstance(found[0], str) else [m[0] for m in found])

        count = len(matches_found)
        density = (count / word_count) * 100.0
        return {
            "count": count,
            "density_per_100_words": round(density, 4),
            "matches": matches_found,
        }

    def analyze(self, text: str, sentences: List[str]) -> Dict[str, any]:
        """
        Runs comprehensive stylometric analysis on text.
        """
        words = self.tokenize_words(text)
        word_count = len(words)
        sentence_count = max(1, len(sentences))

        vocab_stats = self.compute_vocabulary_diversity(words)
        passive_ratio = self.compute_passive_voice_ratio(text, sentence_count)
        trigram_rep = self.compute_ngram_repetition(words, n=3)
        fourgram_rep = self.compute_ngram_repetition(words, n=4)
        ai_phrases = self.compute_ai_phrase_density(text, word_count)

        # Average word length in characters
        avg_word_len = sum(len(w) for w in words) / word_count if word_count > 0 else 0.0

        # Punctuation diversity
        punct_marks = re.findall(r'[.,!?;:\-"\'()—]', text)
        punct_density = (len(punct_marks) / word_count) * 100.0 if word_count > 0 else 0.0

        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "ttr": vocab_stats["ttr"],
            "root_ttr": vocab_stats["root_ttr"],
            "log_ttr": vocab_stats["log_ttr"],
            "passive_voice_ratio": passive_ratio,
            "trigram_repetition": trigram_rep,
            "fourgram_repetition": fourgram_rep,
            "ai_phrase_count": ai_phrases["count"],
            "ai_phrase_density": ai_phrases["density_per_100_words"],
            "ai_phrases_detected": ai_phrases["matches"][:8],
            "avg_word_length": round(avg_word_len, 2),
            "punctuation_density": round(punct_density, 2),
        }
