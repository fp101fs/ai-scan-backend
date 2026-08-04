import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are GPTZero-Sim, an advanced statistical text-analysis engine trained to detect AI-generated content. Your task is to evaluate the provided target text using the core metrics of natural language statistical unpredictability and machine-learning stylometrics.

### ANALYSIS INSTRUCTIONS

Analyze the input text across four specific dimensions:
1. Perplexity (Predictability)
2. Burstiness (Sentence & Rhythm Variation)
3. Structural & Syntax Uniformity
4. Synthetic Markers & Transition Densities

CRITICAL: You MUST respond ONLY with valid, unformatted JSON containing exactly one field "ai_probability" with a float value between 0.0 and 1.0. Example: {"ai_probability": 0.85}. Do not include markdown code blocks, explanations, or any other characters.`;

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
      const aiProb = await callOpenRouter(para.text);

      results.push({
        index: para.index,
        text: para.text,
        wordCount: para.wordCount || para.text.split(/\s+/).length,
        aiProbability: aiProb,
        method: "openrouter",
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

  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured on server");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://ai-scan-backend.vercel.app",
      "X-Title": "AI Scan Backend",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-luna",
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
      // Normalize percentage (e.g. 85 -> 0.85) if model returned > 1
      const normalized = val > 1 ? val / 100 : val;
      return Math.max(0, Math.min(1, normalized));
    }
  } catch {
    // Robust fallback regex for numbers between 0 and 100 or floats
    const match = content.match(/ai_probability["\s:]+([0-9.]+)/i) || content.match(/([0-9.]+)/);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        const normalized = val > 1 ? val / 100 : val;
        return Math.max(0, Math.min(1, normalized));
      }
    }
  }

  console.error("Failed raw content:", rawContent);
  throw new Error(`Could not parse OpenRouter response (raw output: ${rawContent.substring(0, 60)})`);
}
