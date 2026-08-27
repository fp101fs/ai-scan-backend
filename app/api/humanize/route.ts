import { getServerSession } from "next-auth/next";
import { decode } from "next-auth/jwt";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { advancedHeuristicHumanize } from "../../../lib/heuristics";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-OpenRouter-Key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    let effectiveApiKey: string | undefined = process.env.OPENROUTER_API_KEY;
    const customKeyHeader = req.headers.get("x-openrouter-key");
    const authHeader = req.headers.get("authorization");

    if (customKeyHeader) {
      effectiveApiKey = customKeyHeader;
    } else {
      try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as any;
        if (sessionUser?.openRouterKey) {
          effectiveApiKey = sessionUser.openRouterKey;
        }
      } catch {
        // Ignore session extraction failure
      }

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
          // fallback
        }
      }
    }

    const body = await req.json();
    const { text, model = "deepseek/deepseek-v4-flash-0731" } = body;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Valid text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (effectiveApiKey) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXTAUTH_URL || "https://aidetector.buzz",
            "X-Title": "AIDetector.buzz Humanizer",
          },
          body: JSON.stringify({
            model: model,
            temperature: 0.88,
            messages: [
              {
                role: "system",
                content: `You are an expert human prose rewrite engine designed to bypass GPTZero and AI detection benchmarks.
Your job is to rewrite the input text so it reads as 100% natural, organic human writing.

STRICT RULES:
1. Break robotic sentence symmetry: mix short, punchy 3-8 word sentences with longer descriptive sentences (high burstiness / perplexity).
2. Purge all academic AI clichés: NEVER use "furthermore", "moreover", "in conclusion", "testament to", "delve", "tapestry", "seamlessly", "multifaceted", "pivotal milestone", "unlock unprecedented", "fosters a", "crucial role".
3. Use plain, conversational English with natural contractions (it's, they're, don't, we've) and direct phrasing.
4. Keep all original facts and core meaning intact.
5. Return ONLY the rewritten text without preambles, titles, or quotes.`,
              },
              {
                role: "user",
                content: text,
              },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rewritten = data.choices?.[0]?.message?.content?.trim();
          if (rewritten) {
            return NextResponse.json(
              {
                humanizedText: rewritten,
                method: "openrouter",
                model: model,
              },
              { headers: corsHeaders }
            );
          }
        }
      } catch (err) {
        console.warn("OpenRouter humanize failed, using fallback:", err);
      }
    }

    // Heuristic Humanizer fallback
    const fallbackText = advancedHeuristicHumanize(text);
    return NextResponse.json(
      {
        humanizedText: fallbackText,
        method: "heuristic",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Humanization request failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
