"""
Meta-Classifier Module for Hybrid AI-Text Detection

Trains and runs inference on the fused feature vectors (Perplexity + Burstiness + Stylometrics)
to predict document-level and sentence-level AI probabilities.
"""

from typing import List, Dict, Tuple, Optional, Any
import os
import json
import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import StratifiedKFold, cross_validate
    import joblib
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    LogisticRegression = None
    StandardScaler = None
    joblib = None

from .features import FeatureExtractor, FEATURE_NAMES


DEFAULT_WEIGHTS = [
    2.85,   # ensemble_ppl_prob (+ pushes to AI)
    -2.40,  # b_comp (- lower burstiness pushes to AI)
    -1.20,  # b_sent (- lower sentence variance pushes to AI)
    -0.80,  # b_clause (- lower clause variance pushes to AI)
    -0.60,  # b_para (- lower para variance pushes to AI)
    -1.40,  # ttr (- low lexical diversity pushes to AI)
    -0.50,  # root_ttr
    1.10,   # passive_voice_ratio (+ pushes to AI)
    1.60,   # trigram_repetition (+ pushes to AI)
    1.40,   # fourgram_repetition (+ pushes to AI)
    2.20,   # ai_phrase_density (+ pushes to AI)
    0.30,   # avg_word_length
    -0.20,  # punctuation_density
    0.10,   # mean_sentence_len
]
DEFAULT_INTERCEPT = -0.35


class MetaClassifier:
    """
    Trained binary meta-classifier combining multi-model perplexity,
    multi-scale burstiness, and stylometric features.
    """

    def __init__(
        self,
        feature_extractor: Optional[FeatureExtractor] = None,
        model_type: str = "logistic",
        c_param: float = 1.0,
    ):
        self.feature_extractor = feature_extractor or FeatureExtractor()
        self.model_type = model_type
        self.c_param = c_param
        self.is_fitted = False

        if HAS_SKLEARN and HAS_NUMPY:
            self.scaler = StandardScaler()
            self.model = LogisticRegression(
                C=c_param,
                class_weight="balanced",
                max_iter=1000,
                random_state=42,
            )
        else:
            self.scaler = None
            self.model = None

        self.default_weights = list(DEFAULT_WEIGHTS)
        self.default_intercept = float(DEFAULT_INTERCEPT)

    def fit(self, X: Any, y: Any) -> Dict[str, float]:
        """
        Fits the scaler and meta-classifier on training feature vectors and binary labels.
        """
        if not HAS_SKLEARN or not HAS_NUMPY:
            raise RuntimeError("scikit-learn and numpy are required to train. Run: pip install scikit-learn numpy")

        X_mat = np.array(X, dtype=np.float32) if not isinstance(X, np.ndarray) else X
        y_vec = np.array(y, dtype=np.int32) if not isinstance(y, np.ndarray) else y

        X_scaled = self.scaler.fit_transform(X_mat)
        self.model.fit(X_scaled, y_vec)
        self.is_fitted = True

        cv_metrics = {}
        if len(y_vec) >= 10 and len(np.unique(y_vec)) > 1:
            n_splits = min(5, min(np.bincount(y_vec.astype(int))))
            if n_splits >= 2:
                cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
                scores = cross_validate(
                    self.model,
                    X_scaled,
                    y_vec,
                    cv=cv,
                    scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
                )
                cv_metrics = {
                    "cv_accuracy": float(np.mean(scores["test_accuracy"])),
                    "cv_precision": float(np.mean(scores["test_precision"])),
                    "cv_recall": float(np.mean(scores["test_recall"])),
                    "cv_f1": float(np.mean(scores["test_f1"])),
                    "cv_roc_auc": float(np.mean(scores["test_roc_auc"])),
                }

        return cv_metrics

    def predict_proba(self, X: Any) -> List[float]:
        """
        Computes AI probability for feature vectors.
        """
        if self.is_fitted and HAS_SKLEARN and self.model is not None and HAS_NUMPY:
            X_mat = np.array(X, dtype=np.float32)
            if X_mat.ndim == 1:
                X_mat = X_mat.reshape(1, -1)
            X_scaled = self.scaler.transform(X_mat)
            probs = self.model.predict_proba(X_scaled)[:, 1]
            return probs.tolist()

        # Pure Python dot-product & sigmoid evaluation
        if isinstance(X, list) and (len(X) == 0 or not isinstance(X[0], (list, tuple))):
            # Single sample 1D vector
            samples = [X]
        elif HAS_NUMPY and isinstance(X, np.ndarray) and X.ndim == 1:
            samples = [X.tolist()]
        elif HAS_NUMPY and isinstance(X, np.ndarray):
            samples = X.tolist()
        else:
            samples = X

        results = []
        for sample in samples:
            dot = sum(a * b for a, b in zip(sample, self.default_weights)) + self.default_intercept
            dot = max(-15.0, min(15.0, dot))
            prob = 1.0 / (1.0 + math.exp(-dot))
            results.append(prob)

        return results

    def predict_document(self, text: str) -> Dict[str, Any]:
        """
        Performs full document-level detection.
        """
        features, metadata = self.feature_extractor.extract_document_features(text)
        prob = float(self.predict_proba(features)[0])

        if prob >= 0.70:
            verdict = "Entirely AI-Generated"
        elif prob >= 0.45:
            verdict = "Mixed / AI-Assisted Content"
        else:
            verdict = "Likely Human-Written"

        return {
            "ai_probability": round(prob, 4),
            "ai_percentage": round(prob * 100, 1),
            "verdict": verdict,
            "features": metadata["feature_dict"],
            "perplexity": metadata["perplexity"],
            "burstiness": metadata["burstiness"],
            "stylometry": metadata["stylometry"],
            "sentence_count": len(metadata["sentences"]),
            "sentences_raw": metadata["sentences"],
        }

    def predict_sentences(
        self, text: str, threshold: float = 0.60
    ) -> List[Dict[str, Any]]:
        """
        Performs sentence-level AI probability evaluation.
        """
        sentences = self.feature_extractor.burstiness.split_sentences(text)
        results = []

        for idx, s in enumerate(sentences):
            s_clean = s.strip()
            if not s_clean:
                continue

            s_features = self.feature_extractor.extract_sentence_features(s_clean)
            prob = float(self.predict_proba(s_features)[0])

            words = s_clean.split()
            if len(words) < 5:
                prob = prob * 0.85

            results.append({
                "index": idx,
                "text": s_clean,
                "word_count": len(words),
                "ai_probability": round(prob, 4),
                "ai_percentage": round(prob * 100, 1),
                "is_ai_likely": prob >= threshold,
            })

        return results

    def save(self, model_path: str, scalers_path: Optional[str] = None):
        """Saves model and scaler artifacts to disk."""
        os.makedirs(os.path.dirname(os.path.abspath(model_path)), exist_ok=True)

        if HAS_SKLEARN and self.is_fitted and joblib:
            bundle = {
                "model": self.model,
                "scaler": self.scaler,
                "feature_names": FEATURE_NAMES,
                "is_fitted": self.is_fitted,
            }
            joblib.dump(bundle, model_path)
            print(f"[Model Saved] Saved trained model artifact to {model_path}")

        # Always write JSON representation as well for cross-runtime portability
        meta_json = {
            "weights": self.default_weights,
            "intercept": float(self.default_intercept),
            "feature_names": FEATURE_NAMES,
        }
        json_path = model_path if model_path.endswith(".json") else f"{model_path}.json"
        with open(json_path, "w") as f:
            json.dump(meta_json, f, indent=2)
        print(f"[Model Saved] Saved parameter configuration to {json_path}")

    def load(self, model_path: str):
        """Loads model and scaler artifacts from disk."""
        if not os.path.exists(model_path):
            if os.path.exists(f"{model_path}.json"):
                model_path = f"{model_path}.json"
            else:
                raise FileNotFoundError(f"Model file not found at {model_path}")

        if model_path.endswith(".json"):
            with open(model_path, "r") as f:
                data = json.load(f)
                self.default_weights = list(data["weights"])
                self.default_intercept = float(data["intercept"])
            print(f"[Model Loaded] Loaded weights from {model_path}")
        elif HAS_SKLEARN and joblib:
            bundle = joblib.load(model_path)
            self.model = bundle["model"]
            self.scaler = bundle["scaler"]
            self.is_fitted = bundle.get("is_fitted", True)
            print(f"[Model Loaded] Loaded trained scikit-learn bundle from {model_path}")
