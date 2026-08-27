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
                content: `Write the following content so it reads like it was written naturally by a real person, not generated from a predictable AI template.

Prioritize:
* Natural variation in sentence length and structure.
* Specific, concrete details instead of generic filler.
* A clear personal voice appropriate to the subject.
* Occasional informal phrasing where it fits naturally.
* Smooth but not overly polished transitions.
* Genuine reasoning and nuanced opinions rather than perfectly balanced statements.
* Vocabulary that matches how an educated person would actually speak in this context.
* A mix of short, medium, and longer paragraphs.
* Direct statements where appropriate instead of constantly qualifying claims.
* Natural emphasis and occasional stylistic quirks.
* Removing repetitive ideas, unnecessary summaries, and generic introductions.
* Avoiding predictable "AI essay" structures such as "Firstly... Secondly... Finally..." unless genuinely appropriate.

Do NOT:
* Deliberately insert spelling or grammatical mistakes.
* Add random typos, weird punctuation, or unnatural errors.
* Use thesaurus-heavy vocabulary merely to sound sophisticated.
* Force sentence fragments or awkward constructions.
* Add fake personal experiences or facts that weren't provided.
* Mention AI detection, AI detectors, or this instruction in the resulting text.
* Optimize for any particular AI detector or claim that the result will receive a specific detection score.

Before producing the final text, silently revise it once for naturalness, specificity, and variation. Remove anything that sounds templated, repetitive, generic, or unnecessarily polished. Return ONLY the rewritten text without preambles, introductory notes, or quotes.`,
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
