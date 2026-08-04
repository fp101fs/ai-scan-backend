import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// CORS headers for Chrome extension requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication — allow both session and Bearer token
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get("authorization");

    if (!session && !authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized — sign in required" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { paragraphs, mode } = body;

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
      let aiProb: number | null = null;
      let method = "heuristic";

      if ((mode === "openrouter" || mode === "hybrid") && process.env.OPENROUTER_API_KEY) {
        try {
          aiProb = await callOpenRouter(para.text);
          method = "openrouter";
        } catch (e: any) {
          console.warn("OpenRouter failed:", e.message);
        }
      }

      if (aiProb === null) {
        aiProb = heuristicScore(para.text);
        method = "heuristic";
      }

      if (mode === "hybrid" && method === "openrouter") {
        const heuristic = heuristicScore(para.text);
        aiProb = aiProb * 0.7 + heuristic * 0.3;
        method = "hybrid";
      }

      results.push({
        index: para.index,
        text: para.text,
        wordCount: para.wordCount || para.text.split(/\s+/).length,
        aiProbability: aiProb,
        method,
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

async function callOpenRouter(text: string): Promise<number> {
  const truncated = text.substring(0, 1000);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://ai-scan.vercel.app",
      "X-Title": "AI Scan Backend",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            'You are an AI text detector. Analyze the provided text and return ONLY a JSON object with a single field "ai_probability" (a number between 0 and 1). No other text.',
        },
        {
          role: "user",
          content: `Text: "${truncated}"\n\nReturn JSON: {"ai_probability": <number>}`,
        },
      ],
      temperature: 0.0,
      max_tokens: 50,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API returned ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(content);
    return Math.max(0, Math.min(1, parsed.ai_probability));
  } catch {
    const match = content.match(/ai_probability["\\s:]+(\\d+\\.?\\d*)/);
    if (match) {
      return Math.max(0, Math.min(1, parseFloat(match[1])));
    }
    throw new Error("Could not parse OpenRouter response");
  }
}

// ─── Heuristic detection (same algorithm as extension) ──────────────────────

function heuristicScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  if (sentences.length < 2) return 0.3;

  // 1. Sentence length variance
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
  const cv = Math.sqrt(variance) / (avgLen || 1);
  const uniformityScore = Math.max(0, 1 - cv / 0.8);

  // 2. Vocabulary richness (type-token ratio)
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const uniqueWords = new Set(words);
  const ttr = words.length > 0 ? uniqueWords.size / words.length : 0;
  const richnessScore = Math.max(0, 1 - ttr / 0.5);

  // 3. Common AI phrases
  const aiPhrases = [
    "in conclusion", "furthermore", "moreover", "it is important to note",
    "additionally", "in summary", "delve into", "tapestry", "landscape",
    "crucial", "pivotal", "testament", "seamless", "foster", "nuanced",
    "broader", "multifaceted", "serves as a", "plays a crucial role",
    "it is worth noting", "it is important to recognize", "in today's world",
    "in the modern era", "a testament to", "serves as", "plays a",
    "demonstrates a", "exhibits a", "represents a", "signals a",
    "it is clear that", "it is evident that", "it should be noted",
    "one must consider", "a closer look", "at first glance",
    "by examining", "when we look", "it is undeniable", "undeniably",
    "certainly", "indeed", "notably", "particularly", "essentially",
    "fundamentally", "significantly", "remarkably", "interestingly",
    "it is worth mentioning", "it is worth highlighting", "needless to say",
    "without a doubt", "in essence", "in other words", "to put it differently",
  ];
  const textLower = text.toLowerCase();
  let aiPhraseCount = 0;
  aiPhrases.forEach((phrase) => {
    if (textLower.includes(phrase)) aiPhraseCount++;
  });
  const phraseScore = Math.min(1, aiPhraseCount / 5);

  // 4. Repetition of sentence starters
  const starters = sentences.map((s) =>
    s.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase()
  );
  const starterCounts: Record<string, number> = {};
  starters.forEach((s) => {
    starterCounts[s] = (starterCounts[s] || 0) + 1;
  });
  const maxStarterRep = Math.max(...Object.values(starterCounts));
  const repetitionScore = Math.min(1, (maxStarterRep - 1) / 3);

  // 5. Hedging / qualifier density
  const hedges = [
    "may", "might", "could", "potentially", "possibly", "seems", "appears",
    "likely", "tends to",
  ];
  let hedgeCount = 0;
  hedges.forEach((h) => {
    const regex = new RegExp(`\\b${h}\\b`, "g");
    const matches = textLower.match(regex);
    if (matches) hedgeCount += matches.length;
  });
  const hedgeScore = Math.min(1, hedgeCount / sentences.length);

  const score =
    uniformityScore * 0.25 +
    richnessScore * 0.2 +
    phraseScore * 0.25 +
    repetitionScore * 0.15 +
    hedgeScore * 0.15;

  return Math.max(0, Math.min(1, score));
}
