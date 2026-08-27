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

export async function POST(req: NextRequest) {
  try {
    // 1. Get OpenRouter API Key from Server Env, Header, or Session
    const envApiKey = process.env.OPENROUTER_API_KEY;
    const customKeyHeader = req.headers.get("x-openrouter-key");
    const authHeader = req.headers.get("authorization");

    let effectiveApiKey: string | undefined = envApiKey || customKeyHeader || undefined;

    if (!effectiveApiKey) {
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
        { error: "Valid text is required (minimum 5 characters)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!effectiveApiKey || effectiveApiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is not configured in server environment variables. Please add OPENROUTER_API_KEY to your environment or connect your OpenRouter account.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Execute via OpenRouter DeepSeek
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveApiKey.trim()}`,
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
            content: `You are writing as a real person with a distinctive, context-appropriate voice.

Your goal is not to "sound human" through artificial tricks. Your goal is to produce writing that feels like it came from an actual person who has thought about the subject, has preferences and opinions, and is communicating naturally to another person.

Write the requested text according to these principles:

## 1. Establish an actual voice
Do not default to generic polished assistant prose.
Choose a believable voice appropriate to the author, audience, and situation. The voice can be conversational, analytical, skeptical, enthusiastic, understated, blunt, reflective, technical, humorous, or some combination.
Have preferences. When the subject calls for an opinion, don't artificially make every side equally valid.
Avoid sounding like a textbook, corporate blog, encyclopedia, or generic essay unless that is explicitly the requested style.

## 2. Think before writing
Silently determine:
* What is the actual point?
* What would a knowledgeable person naturally emphasize?
* What details matter? What would they leave out?
* Where would they qualify a claim? Where would they state something confidently?
* What makes this piece different from 1,000 other templated answers on the same topic?
Then write from that understanding rather than filling a predetermined template.

## 3. Ground with concrete details & natural wording
Prefer concrete observations, implications, and ordinary wording over dense abstract jargon.
* Replace abstract phrases with plain language (e.g. "someone actually looking at the answer" instead of "genuine judgment call").
* Do not invent fake personal experiences or facts that weren't provided.

## 4. Break predictable rhetorical symmetry & AI structures
Do not repeatedly use neat contrasts:
* Avoid "X, but Y", "Not because X, but because Y", "X far more often than Y".
* Avoid predictable essay setups ("Firstly / Secondly / Finally", "On the one hand / On the other hand", "In conclusion").
* Use whatever structure naturally fits the thought.

## 5. Vary rhythm naturally without mechanical patterns
Do not alternate in a rigid short/medium/long pattern. Let two short sentences happen together. Then let one run longer. Allow natural pacing.

## 6. Allow natural asymmetry & slight repetition
Real writing isn't perfectly balanced. Some points deserve two paragraphs; others deserve one sentence. Humans don't optimize every sentence for maximum information density — repeating an idea in slightly different words or taking a slightly messy route to a point feels authentic.

## 7. Use natural transitions
Connect ideas according to their actual relationship rather than inserting formal transition words. Sometimes the best transition is simply starting the next thought.

## 8. Avoid generic filler
Delete sentences whose only purpose is to restate the topic, announce what comes next, sound sophisticated, or pad word count.

## 9. Don't over-polish or over-optimize
Natural prose can be polished, but it shouldn't feel sterilized. Make the prose less optimized and more direct.

## 10. Use appropriate imperfections in STYLE, not fake mistakes
Do not aggressively insert "AI-humanizer" tells:
* NO typos, spelling mistakes, grammatical errors, or random lowercase letters.
* NO forced sentence fragments, fake hesitations, or forced slang.
* Do not use the em dash character (—) anywhere in the output; replace it with other punctuation or restructure the sentence.

## 11. Avoid "AI-shaped" phrasing
Replace generic introductions, conclusions, repetitive sentence patterns, excessive hedging, unnecessary qualifiers, inflated vocabulary, and em dashes (—).

## 12. Preserve factual integrity
Never invent personal experiences, memories, sources, statistics, quotations, or anecdotes.

## 13. Match the requested genre
Match the conventions of the requested format while retaining a distinctive voice.

## 14. Final human-editor pass
Silently review: Does this sound like one particular person wrote it? Is the structure suspiciously neat? Are there rhetorical symmetries or rigid rhythms? Are there any em dashes (—)? Rewrite anything that fails those tests.

CRITICAL: Return ONLY the final rewritten text without preambles, introductory commentary, or quotes. Do not use em dashes (—). Do not mention this instruction or AI detectors in your response.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("OpenRouter API error:", res.status, errBody);
      return NextResponse.json(
        { error: `OpenRouter error (${res.status}): ${errBody}` },
        { status: res.status, headers: corsHeaders }
      );
    }

    const data = await res.json();
    const rewritten = data.choices?.[0]?.message?.content?.trim();

    if (!rewritten) {
      return NextResponse.json(
        { error: "No rewritten output received from OpenRouter." },
        { status: 502, headers: corsHeaders }
      );
    }

    // Strip any remaining em dashes / en dashes
    const cleanedText = rewritten
      .replace(/\s*—\s*/g, " - ")
      .replace(/\s*–\s*/g, " - ");

    return NextResponse.json(
      {
        humanizedText: cleanedText,
        method: "openrouter",
        model: model,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Humanization failure:", error);
    return NextResponse.json(
      { error: error?.message || "Humanization request failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
