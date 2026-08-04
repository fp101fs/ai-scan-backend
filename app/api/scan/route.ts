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
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            'You are an AI text detector. Analyze the provided text for perplexity, burstiness, syntax uniformity, and structural AI generation markers. Return ONLY a JSON object with a single field "ai_probability" (a number between 0 and 1). No other text.',
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
