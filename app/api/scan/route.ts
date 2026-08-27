import { NextRequest, NextResponse } from "next/server";
import { scanWithGPTZero } from "../../../lib/gptzero";

// CORS headers for API and Chrome extension requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-OpenRouter-Key, X-Detection-Model",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paragraphs } = body;

    if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "paragraphs array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Cap at 100 paragraphs per request
    const toScan = paragraphs.slice(0, 100);
    const results = [];

    for (const para of toScan) {
      const text = typeof para === "string" ? para : para.text || "";
      const index = typeof para === "object" ? para.index ?? results.length : results.length;
      
      const gptZeroStats = scanWithGPTZero(text);
      const aiProb = gptZeroStats.overallAiProbability / 100;

      results.push({
        index,
        text,
        wordCount: text.trim().split(/\s+/).filter(Boolean).length,
        sentenceCount: gptZeroStats.sentences.length,
        aiProbability: aiProb,
        perplexityScore: gptZeroStats.averagePerplexity,
        burstinessScore: gptZeroStats.burstinessScore,
        completelyGeneratedProb: gptZeroStats.completelyGeneratedProb,
        mixedGeneratedProb: gptZeroStats.mixedGeneratedProb,
        humanWrittenProb: gptZeroStats.humanWrittenProb,
        verdict: gptZeroStats.verdict,
        subVerdict: gptZeroStats.subVerdict,
        classLabel: gptZeroStats.classLabel,
        method: "gptzero-engine",
        sentences: gptZeroStats.sentences.map((s) => ({
          text: s.sentence,
          score: s.score,
          isAi: s.isAi,
          wordCount: s.wordCount,
          perplexity: s.perplexity,
          highlightColor: s.highlightColor,
          aiPhraseMatches: s.aiPhrases,
        })),
      });
    }

    return NextResponse.json(results, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Scan error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
