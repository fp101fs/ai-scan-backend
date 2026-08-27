import { getServerSession } from "next-auth/next";
import { decode } from "next-auth/jwt";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-OpenRouter-Key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function heuristicHumanize(inputText: string): string {
  if (!inputText || inputText.trim().length === 0) return "";

  const replacements: [RegExp, string][] = [
    [/\bFurthermore,\s*/gi, "Also, "],
    [/\bMoreover,\s*/gi, "On top of that, "],
    [/\bIn conclusion,\s*/gi, "All in all, "],
    [/\bIt is important to note that\s*/gi, "Keep in mind that "],
    [/\bIt should be noted that\s*/gi, "Noticeably, "],
    [/\bstands as a testament to\s*/gi, "proves "],
    [/\bserves as a testament to\s*/gi, "reflects "],
    [/\bdelve into\s*/gi, "look closely at "],
    [/\bdelves into\s*/gi, "looks into "],
    [/\bmultifaceted\s*/gi, "complex "],
    [/\bseamlessly\s*/gi, "smoothly "],
    [/\btapestry of\s*/gi, "mix of "],
    [/\bpivotal milestone\s*/gi, "key step "],
    [/\bcomputational architectures\s*/gi, "computing systems "],
    [/\bfacilitates substantial enhancements in\s*/gi, "substantially boosts "],
    [/\bIn accordance with recent analytical assessments,\s*/gi, "Based on recent findings, "],
    [/\butilize\s*/gi, "use "],
    [/\butilizes\s*/gi, "uses "],
    [/\butilizing\s*/gi, "using "],
  ];

  let result = inputText;
  for (const [pattern, rep] of replacements) {
    result = result.replace(pattern, rep);
  }

  return result;
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

    const body = await req.json();
    const { text } = body;

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
            model: "openai/gpt-4o-mini",
            temperature: 0.85,
            messages: [
              {
                role: "system",
                content: `You are an expert human prose rewrite engine. Rewrite the input text so it sounds authentic, natural, and human-written while keeping all core facts and meaning. Break repetitive cadence, eliminate synthetic AI cliché markers (e.g. furthermore, moreover, delve, tapestry, testament to), and increase sentence length variance. Return ONLY the rewritten text without preambles or notes.`,
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
                model: "openai/gpt-4o-mini",
              },
              { headers: corsHeaders }
            );
          }
        }
      } catch (err) {
        console.warn("OpenRouter humanize failed, using fallback:", err);
      }
    }

    const fallbackText = heuristicHumanize(text);
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
