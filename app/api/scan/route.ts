import { getServerSession } from "next-auth/next";
import { decode } from "next-auth/jwt";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { analyzeHeuristics } from "../../../lib/heuristics";
import { scanWithGPTZero } from "../../../lib/gptzero";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are GPTZero-Sim, an advanced statistical text-analysis engine trained to detect AI-generated content. Your task is to evaluate the provided target text using the core metrics of natural language statistical unpredictability and machine-learning stylometrics.

### ANALYSIS INSTRUCTIONS
Analyze the input text across four specific dimensions:
1. Perplexity (Predictability & Lexical entropy)
2. Burstiness (Sentence & Rhythm Variation)
3. Structural & Syntax Uniformity
4. Synthetic Markers & Transition Densities

CRITICAL: You MUST respond ONLY with valid, unformatted JSON containing exactly one field "ai_probability" with a float value between 0.0 and 1.0. Example: {"ai_probability": 0.85}. Do not include markdown code blocks, explanations, or any other characters.`;

// CORS headers for Chrome extension requests
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
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get("authorization");
    const customKeyHeader = req.headers.get("x-openrouter-key");

    let sessionUser = session?.user as any;
    let effectiveApiKey =
      customKeyHeader ||
      sessionUser?.openRouterKey ||
      process.env.OPENROUTER_API_KEY;

    // Check Bearer JWT token if sent by Chrome extension
    if (!effectiveApiKey && authHeader?.startsWith("Bearer ")) {
      const tokenString = authHeader.replace("Bearer ", "").trim();
      const secret =
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        "ai-scan-secret-production-key-9284102941";

      try {
        const decoded = await decode({ token: tokenString, secret });
        if (decoded?.openRouterKey) {
          effectiveApiKey = decoded.openRouterKey as string;
        }
      } catch {
        // Bearer token decode failed, continue to check fallback
      }
    }

    const body = await req.json();
    const { paragraphs, mode = "hybrid", model = "openai/gpt-4o-mini" } = body;

    if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "paragraphs array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Require authentication or heuristic mode if no API key is available
    if (mode !== "heuristic" && !effectiveApiKey) {
      // Fallback gracefully to heuristic mode if no OpenRouter key is configured
      console.warn("No OpenRouter API key found. Falling back to heuristic mode.");
    }

    // Cap at 100 paragraphs per request
    const toScan = paragraphs.slice(0, 100);
    const results = [];

    for (const para of toScan) {
      const text = typeof para === "string" ? para : para.text || "";
      const index = typeof para === "object" ? para.index ?? results.length : results.length;
      
      const gptZeroStats = scanWithGPTZero(text);
      let aiProb = gptZeroStats.overallAiProbability / 100;
      let usedMethod = "gptzero-engine";

      if (effectiveApiKey && (mode === "openrouter" || mode === "hybrid")) {
        try {
          const aiResponse = await callOpenRouter(text, effectiveApiKey, model);
          if (mode === "hybrid") {
            aiProb = Math.round((aiResponse * 0.65 + (gptZeroStats.overallAiProbability / 100) * 0.35) * 100) / 100;
            usedMethod = "gptzero-hybrid";
          } else {
            aiProb = aiResponse;
            usedMethod = "openrouter";
          }
        } catch (err: any) {
          console.warn("OpenRouter call failed, falling back to GPTZero score:", err.message);
          aiProb = gptZeroStats.overallAiProbability / 100;
          usedMethod = "gptzero-fallback";
        }
      }

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
        method: usedMethod,
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

async function callOpenRouter(
  text: string,
  apiKey: string,
  modelName: string = "openai/gpt-4o-mini"
): Promise<number> {
  const truncated = text.substring(0, 1500);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://ai-scan-backend.vercel.app",
      "X-Title": "AI Scan (ProductHunt)",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this text and output JSON {"ai_probability": number}:\n\n"${truncated}"`,
        },
      ],
      temperature: 0.0,
      max_tokens: 150,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenRouter API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content || "";
  const content = rawContent.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(content);
    const val = Number(parsed.ai_probability ?? parsed.probability ?? parsed.score);
    if (!isNaN(val)) {
      const normalized = val > 1 ? val / 100 : val;
      return Math.max(0, Math.min(1, Math.round(normalized * 100) / 100));
    }
  } catch {
    const match = content.match(/ai_probability["\s:]+([0-9.]+)/i) || content.match(/([0-9.]+)/);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        const normalized = val > 1 ? val / 100 : val;
        return Math.max(0, Math.min(1, Math.round(normalized * 100) / 100));
      }
    }
  }

  throw new Error(`Could not parse OpenRouter response (raw output: ${rawContent.substring(0, 60)})`);
}
