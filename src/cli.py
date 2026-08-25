"""
Command-Line Interface for Hybrid AI Detector (GPTZero + ZeroGPT Signal Fusion)
"""

import argparse
import sys
import os
import json
import glob
from typing import List

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

from .perplexity import PerplexityEngine
from .burstiness import BurstinessEngine
from .stylometry import StylometryEngine
from .features import FeatureExtractor
from .classifier import MetaClassifier


def print_banner():
    banner = """
========================================================================
   AI SCAN — HYBRID ML DETECTOR (GPTZero + ZeroGPT Signal Fusion)
   Multi-Model Perplexity · Multi-Scale Burstiness · Meta-Classifier
========================================================================
"""
    print(banner)


def cmd_detect(args):
    """Execute detection on a single text or file."""
    if args.text:
        text = args.text
    elif args.file:
        if not os.path.exists(args.file):
            print(f"[Error] File not found: {args.file}")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        print("[Error] Must provide either --text or --file")
        sys.exit(1)

    if not text.strip():
        print("[Error] Provided text is empty.")
        sys.exit(1)

    # Initialize engines
    models = [m.strip() for m in args.models.split(",")] if args.models else ["gpt2", "distilgpt2"]
    ppl_engine = PerplexityEngine(model_names=models)
    burst_engine = BurstinessEngine()
    stylo_engine = StylometryEngine()
    extractor = FeatureExtractor(ppl_engine, burst_engine, stylo_engine)
    classifier = MetaClassifier(feature_extractor=extractor)

    if args.model_path and (os.path.exists(args.model_path) or os.path.exists(f"{args.model_path}.json")):
        try:
            classifier.load(args.model_path)
        except Exception as e:
            print(f"[Warning] Could not load custom model ({e}), using calibrated defaults.")

    print(f"\n[Analyzing] Text length: {len(text)} chars | {len(text.split())} words...")
    doc_result = classifier.predict_document(text)
    sentence_results = classifier.predict_sentences(text, threshold=args.threshold)

    print("\n" + "=" * 70)
    print("                      DETECTION REPORT")
    print("=" * 70)
    print(f"Overall AI Probability : {doc_result['ai_percentage']}% ({doc_result['ai_probability']:.4f})")
    print(f"Classification Verdict : {doc_result['verdict']}")
    print("-" * 70)
    print("CORE SIGNALS BREAKDOWN:")
    print(f"  • Ensemble Perplexity AI Score : {doc_result['perplexity']['ensemble_score']:.4f} (Raw PPL: {doc_result['perplexity']['raw_ppl']})")
    print(f"  • Composite Burstiness Score   : {doc_result['burstiness']['b_comp']:.4f} (Sentence B: {doc_result['burstiness']['b_sent']:.4f}, Clause B: {doc_result['burstiness']['b_clause']:.4f})")
    print(f"  • Vocabulary Diversity (TTR)   : {doc_result['stylometry']['ttr'] * 100:.1f}% (Unique / Total tokens)")
    print(f"  • Passive Voice Ratio          : {doc_result['stylometry']['passive_voice_ratio']:.2f} per sentence")
    print(f"  • AI Template Phrase Matches   : {doc_result['stylometry']['ai_phrase_count']} detected")
    print("=" * 70)

    print(f"\nSENTENCE-BY-SENTENCE BREAKDOWN (Threshold: {args.threshold * 100:.0f}%):")
    for s in sentence_results:
        marker = "[AI-LIKELY] " if s["is_ai_likely"] else "[HUMAN]     "
        color_prefix = "\033[91m" if s["is_ai_likely"] else "\033[92m"
        color_suffix = "\033[0m"
        print(f"  {color_prefix}{marker}({s['ai_percentage']:>5.1f}% AI | {s['word_count']:>2}w) {s['text']}{color_suffix}")

    print("\n" + "=" * 70)

    if args.json:
        output_payload = {
            "document": doc_result,
            "sentences": sentence_results,
        }
        print("\nJSON Output:\n", json.dumps(output_payload, indent=2))


def cmd_train(args):
    """Train meta-classifier on directories of human and AI text files."""
    human_files = glob.glob(os.path.join(args.human_dir, "*.txt")) + glob.glob(os.path.join(args.human_dir, "*.md"))
    ai_files = glob.glob(os.path.join(args.ai_dir, "*.txt")) + glob.glob(os.path.join(args.ai_dir, "*.md"))

    if not human_files:
        print(f"[Error] No text files found in human directory: {args.human_dir}")
        sys.exit(1)
    if not ai_files:
        print(f"[Error] No text files found in AI directory: {args.ai_dir}")
        sys.exit(1)

    print(f"[Dataset] Found {len(human_files)} human texts and {len(ai_files)} AI texts.")
    print("[Feature Extraction] Computing multi-model perplexity, multi-scale burstiness, and stylometrics...")

    models = [m.strip() for m in args.models.split(",")] if args.models else ["gpt2", "distilgpt2"]
    ppl_engine = PerplexityEngine(model_names=models)
    extractor = FeatureExtractor(ppl_engine)

    X_list = []
    y_list = []

    for path in human_files:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            t = f.read().strip()
        if len(t.split()) >= 10:
            feat, _ = extractor.extract_document_features(t)
            X_list.append(feat)
            y_list.append(0)

    for path in ai_files:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            t = f.read().strip()
        if len(t.split()) >= 10:
            feat, _ = extractor.extract_document_features(t)
            X_list.append(feat)
            y_list.append(1)

    X = np.array(X_list, dtype=np.float32) if HAS_NUMPY else X_list
    y = np.array(y_list, dtype=np.int32) if HAS_NUMPY else y_list

    classifier = MetaClassifier(feature_extractor=extractor, model_type=args.model_type)

    metrics = classifier.fit(X, y)
    print("\n[Cross-Validation Performance]")
    for k, v in metrics.items():
        print(f"  • {k}: {v:.4f}")

    os.makedirs(args.output_dir, exist_ok=True)
    out_model_path = os.path.join(args.output_dir, args.model_name)
    classifier.save(out_model_path)
    print(f"[Complete] Model training finished successfully. Artifact saved to: {out_model_path}")


def cmd_batch(args):
    """Run batch analysis on input file (one document per line or JSONL)."""
    if not os.path.exists(args.input):
        print(f"[Error] Input file not found: {args.input}")
        sys.exit(1)

    models = [m.strip() for m in args.models.split(",")] if args.models else ["gpt2", "distilgpt2"]
    ppl_engine = PerplexityEngine(model_names=models)
    extractor = FeatureExtractor(ppl_engine)
    classifier = MetaClassifier(feature_extractor=extractor)

    if args.model_path and (os.path.exists(args.model_path) or os.path.exists(f"{args.model_path}.json")):
        classifier.load(args.model_path)

    results = []
    with open(args.input, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    print(f"[Batch Processing] Running detection on {len(lines)} documents...")
    for idx, line in enumerate(lines):
        text_to_process = line
        if line.startswith("{") and line.endswith("}"):
            try:
                parsed = json.loads(line)
                text_to_process = parsed.get("text", parsed.get("content", line))
            except Exception:
                text_to_process = line

        doc_res = classifier.predict_document(text_to_process)
        sent_res = classifier.predict_sentences(text_to_process, threshold=args.threshold)

        results.append({
            "id": idx,
            "text_preview": text_to_process[:120] + "...",
            "ai_probability": doc_res["ai_probability"],
            "verdict": doc_res["verdict"],
            "perplexity_score": doc_res["perplexity"]["ensemble_score"],
            "burstiness_score": doc_res["burstiness"]["b_comp"],
            "sentences": sent_res,
        })

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"[Complete] Processed {len(results)} items. Results saved to: {args.output}")


def main():
    print_banner()
    parser = argparse.ArgumentParser(description="Hybrid AI-Text Detector (GPTZero + ZeroGPT Fusion)")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: detect
    p_detect = subparsers.add_parser("detect", help="Run AI detection on text or file")
    p_detect.add_argument("--text", type=str, help="Raw text string to analyze")
    p_detect.add_argument("--file", type=str, help="Path to text/markdown file to analyze")
    p_detect.add_argument("--threshold", type=float, default=0.60, help="Sentence AI highlighting threshold (default: 0.60)")
    p_detect.add_argument("--models", type=str, default="gpt2,distilgpt2", help="Comma-separated Hugging Face causal LM names")
    p_detect.add_argument("--model-path", type=str, default="models/model.pkl", help="Path to trained meta-classifier")
    p_detect.add_argument("--json", action="store_true", help="Output raw JSON payload")

    # Command: train
    p_train = subparsers.add_parser("train", help="Train meta-classifier on calibration datasets")
    p_train.add_argument("--human-dir", type=str, required=True, help="Directory containing human-written text files")
    p_train.add_argument("--ai-dir", type=str, required=True, help="Directory containing AI-generated text files")
    p_train.add_argument("--output-dir", type=str, default="models", help="Directory to save trained model")
    p_train.add_argument("--model-name", type=str, default="model.pkl", help="Filename of saved model")
    p_train.add_argument("--model-type", type=str, default="logistic", help="Classifier type (logistic, forest, boosting)")
    p_train.add_argument("--models", type=str, default="gpt2,distilgpt2", help="Comma-separated Hugging Face causal LM names")

    # Command: batch
    p_batch = subparsers.add_parser("batch", help="Run batch detection on a file of texts")
    p_batch.add_argument("--input", type=str, required=True, help="Path to input text or JSONL file")
    p_batch.add_argument("--output", type=str, required=True, help="Path to output JSON file")
    p_batch.add_argument("--threshold", type=float, default=0.60, help="Sentence AI threshold")
    p_batch.add_argument("--models", type=str, default="gpt2,distilgpt2", help="Comma-separated Hugging Face causal LM names")
    p_batch.add_argument("--model-path", type=str, default="models/model.pkl", help="Path to trained meta-classifier")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "detect":
        cmd_detect(args)
    elif args.command == "train":
        cmd_train(args)
    elif args.command == "batch":
        cmd_batch(args)


if __name__ == "__main__":
    main()
