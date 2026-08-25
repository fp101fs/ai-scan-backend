"""
Multi-Model Perplexity Module (GPTZero-Style Signal)

Mathematical Background:
Perplexity measures how 'surprised' a language model is by a sequence of tokens.
Given an autoregressive language model M_j and a tokenized text t = (t_1, t_2, ..., t_n):
    Loss(t) = - (1 / n) * sum_{i=1}^n log P_{M_j}(t_i | t_{<i})
    PPL_{M_j}(t) = exp(Loss(t))

Lower perplexity indicates that the sequence follows highly predictable statistical patterns
typical of LLM generation. Human writing typically exhibits higher and more irregular perplexity.

Normalization:
Log-perplexity values are standardized using calibration statistics:
    Z_j = (log(PPL_j) - mu_j) / sigma_j
And inverted to an AI probability score where lower perplexity -> higher AI probability.
"""

from typing import List, Dict, Tuple, Optional
import math
import re

# Optional imports for PyTorch & Transformers
try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    AutoModelForCausalLM = None
    AutoTokenizer = None


class PerplexityEngine:
    """
    Computes multi-model perplexity and per-sentence perplexity distributions.
    """

    def __init__(
        self,
        model_names: Optional[List[str]] = None,
        device: Optional[str] = None,
        max_length: int = 1024,
        stride: int = 512,
        calibration_params: Optional[Dict[str, Dict[str, float]]] = None,
    ):
        """
        Initialize the PerplexityEngine with one or more causal language models.

        Args:
            model_names: List of HuggingFace model identifiers (e.g., ['gpt2', 'distilgpt2']).
            device: 'cuda', 'mps', or 'cpu' (auto-detected if None).
            max_length: Maximum sequence length for sliding window perplexity.
            stride: Stride step size for sliding window perplexity.
            calibration_params: Dictionary of per-model mean/std for log-perplexity normalization.
        """
        self.model_names = model_names or ["gpt2", "distilgpt2"]
        self.max_length = max_length
        self.stride = stride
        self.models: Dict[str, any] = {}
        self.tokenizers: Dict[str, any] = {}

        if HAS_TORCH:
            if device is None:
                if torch.cuda.is_available():
                    self.device = "cuda"
                elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    self.device = "mps"
                else:
                    self.device = "cpu"
            else:
                self.device = device
        else:
            self.device = "cpu"

        # Default calibration parameters: log(PPL) mean and std for human vs AI reference
        self.calibration_params = calibration_params or {
            "default": {"mean_log_ppl": 3.85, "std_log_ppl": 0.65},
            "gpt2": {"mean_log_ppl": 3.75, "std_log_ppl": 0.60},
            "distilgpt2": {"mean_log_ppl": 3.90, "std_log_ppl": 0.68},
        }

    def load_model(self, model_name: str):
        """Lazy load a HuggingFace causal LM and tokenizer."""
        if not HAS_TORCH:
            return None, None

        if model_name not in self.models:
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float32 if self.device == "cpu" else torch.float16,
                )
                model.to(self.device)
                model.eval()

                self.models[model_name] = model
                self.tokenizers[model_name] = tokenizer
            except Exception as e:
                print(f"[Warning] Could not load HuggingFace model '{model_name}': {e}. Using fallback tokenizer.")
                return None, None

        return self.models.get(model_name), self.tokenizers.get(model_name)

    def compute_perplexity(self, text: str, model_name: str = "gpt2") -> float:
        """
        Compute sliding-window perplexity for a text using the specified language model.

        Formula:
            PPL = exp( - (1/N) * sum_{i} log P(w_i | w_{<i}) )

        Args:
            text: Input text string.
            model_name: Target causal LM identifier.

        Returns:
            Perplexity score (float).
        """
        clean_text = text.strip()
        if not clean_text:
            return 100.0

        model, tokenizer = self.load_model(model_name)

        # If PyTorch/Transformers is not available or model failed to load, use statistical n-gram fallback
        if model is None or tokenizer is None or not HAS_TORCH:
            return self._statistical_perplexity_fallback(clean_text)

        try:
            with torch.no_grad():
                encodings = tokenizer(clean_text, return_tensors="pt")
                seq_len = encodings.input_ids.size(1)

                if seq_len <= 1:
                    return 50.0

                nlls = []
                prev_end_loc = 0

                for begin_loc in range(0, seq_len, self.stride):
                    end_loc = min(begin_loc + self.max_length, seq_len)
                    trg_len = end_loc - prev_end_loc
                    input_ids = encodings.input_ids[:, begin_loc:end_loc].to(self.device)
                    target_ids = input_ids.clone()
                    target_ids[:, :-trg_len] = -100

                    outputs = model(input_ids, labels=target_ids)
                    neg_log_likelihood = outputs.loss * trg_len
                    nlls.append(neg_log_likelihood)

                    prev_end_loc = end_loc
                    if end_loc == seq_len:
                        break

                total_nll = torch.stack(nlls).sum()
                ppl = torch.exp(total_nll / seq_len).item()

                if math.isnan(ppl) or math.isinf(ppl):
                    return 100.0

                return float(ppl)
        except Exception as e:
            print(f"[Warning] Perplexity computation error: {e}. Using fallback.")
            return self._statistical_perplexity_fallback(clean_text)

    def compute_sentence_perplexities(
        self, sentences: List[str], model_name: str = "gpt2"
    ) -> List[float]:
        """
        Compute perplexity for each individual sentence.

        Args:
            sentences: List of sentence strings.
            model_name: Target model identifier.

        Returns:
            List of perplexity values per sentence.
        """
        results = []
        for s in sentences:
            if len(s.strip().split()) < 3:
                results.append(50.0)
            else:
                results.append(self.compute_perplexity(s, model_name=model_name))
        return results

    def compute_ensemble_perplexity(
        self, text: str, weights: Optional[List[float]] = None
    ) -> Tuple[float, Dict[str, float], float]:
        """
        Compute normalized ensemble perplexity across all configured models.

        Args:
            text: Input text string.
            weights: Optional weights for each model (must sum to 1).

        Returns:
            Tuple of:
              - ensemble_ai_score: Normalized AI probability score [0, 1] derived from perplexity.
              - per_model_ppl: Dictionary mapping model names to raw perplexity values.
              - avg_raw_ppl: Unweighted average raw perplexity.
        """
        if not self.model_names:
            ppl = self._statistical_perplexity_fallback(text)
            norm_score = self.normalize_log_ppl(math.log(max(1.01, ppl)), "default")
            return norm_score, {"fallback": ppl}, ppl

        per_model_ppl = {}
        normalized_scores = []

        num_models = len(self.model_names)
        w = weights or [1.0 / num_models] * num_models

        for i, model_name in enumerate(self.model_names):
            ppl = self.compute_perplexity(text, model_name=model_name)
            per_model_ppl[model_name] = ppl

            log_ppl = math.log(max(1.01, ppl))
            calib_key = model_name if model_name in self.calibration_params else "default"
            norm_score = self.normalize_log_ppl(log_ppl, calib_key)
            normalized_scores.append(w[i] * norm_score)

        ensemble_ai_score = sum(normalized_scores)
        avg_raw_ppl = sum(per_model_ppl.values()) / len(per_model_ppl)

        return ensemble_ai_score, per_model_ppl, avg_raw_ppl

    def normalize_log_ppl(self, log_ppl: float, calib_key: str = "default") -> float:
        """
        Converts log-perplexity into an AI likelihood score [0, 1].
        AI text has lower perplexity (e.g. log_ppl < 3.2), human text has higher perplexity (log_ppl > 4.2).

        Sigmoid transfer:
            p_ai = 1 / (1 + exp( (log_ppl - mean) / (std * 0.7) ))
        """
        params = self.calibration_params.get(calib_key, self.calibration_params["default"])
        mean = params["mean_log_ppl"]
        std = params["std_log_ppl"]

        # Standardized z-score
        z = (log_ppl - mean) / max(0.1, std)

        # Invert: low perplexity (negative z) -> high AI probability
        p_ai = 1.0 / (1.0 + math.exp(z * 1.5))
        return float(max(0.01, min(0.99, p_ai)))

    def _statistical_perplexity_fallback(self, text: str) -> float:
        """
        Statistical entropy-based pseudo-perplexity approximation when PyTorch weights are not present.
        Calculates character & word unigram/bigram cross-entropy.
        """
        words = re.findall(r"\b[a-z0-9'-]+\b", text.lower())
        if len(words) < 2:
            return 45.0

        # Frequency distribution of words
        freqs = {}
        for w in words:
            freqs[w] = freqs.get(w, 0) + 1

        n = len(words)
        # Shannon entropy of word distribution: H = - sum (p * log2(p))
        entropy = 0.0
        for count in freqs.values():
            p = count / n
            entropy -= p * math.log2(p)

        # Bigram transition predictability
        bigrams = [(words[i], words[i + 1]) for i in range(len(words) - 1)]
        bigram_freqs = {}
        for bg in bigrams:
            bigram_freqs[bg] = bigram_freqs.get(bg, 0) + 1

        bg_entropy = 0.0
        for count in bigram_freqs.values():
            p = count / len(bigrams)
            bg_entropy -= p * math.log2(p)

        # AI text typically has low word entropy and high bigram repetition -> lower effective PPL
        combined_entropy = (entropy * 0.6) + (bg_entropy * 0.4)
        approx_ppl = math.pow(2.0, combined_entropy) * 4.5
        return float(max(5.0, min(300.0, approx_ppl)))
