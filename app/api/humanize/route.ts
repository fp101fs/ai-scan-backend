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
    // 1. Prioritize Server Environment API Key
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
        { error: "Valid text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Execute with OpenRouter DeepSeek if API key is present
    if (effectiveApiKey && effectiveApiKey.trim().length > 0) {
      try {
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
* What details matter?
* What would they probably leave out?
* Where would they qualify a claim?
* Where would they simply state something confidently?
* What would make this particular piece different from 1,000 other answers on the same topic?
Then write from that understanding rather than filling a predetermined template.

## 3. Use specific details
Prefer concrete observations, examples, comparisons, and implications over vague statements.
Do not invent facts or personal experiences. If the prompt does not provide a specific detail, don't fabricate one merely to make the writing feel authentic.

## 4. Break predictable structure
Do not automatically use:
* Introduction → three points → conclusion
* Firstly / Secondly / Finally
* On the one hand / On the other hand
* In today's rapidly changing world
* It is important to note that
* Furthermore / Moreover / Additionally
* In conclusion
* "This highlights the importance of..."
* Repetitive thesis statements
* Formulaic topic sentences
Use whatever structure naturally fits the thought.

## 5. Vary rhythm naturally
Use genuine variation in sentence length, sentence openings, paragraph length, syntax, pacing, and degree of formality. A short sentence can follow a long one. Don't create variation mechanically or according to a fixed pattern.

## 6. Allow natural asymmetry
Real writing isn't perfectly balanced. Some points deserve two paragraphs. Others deserve one sentence. Don't make every paragraph perform the same function.

## 7. Use natural transitions
Connect ideas according to their actual relationship rather than inserting formal transition words. Sometimes conversational transitions fit ("That said,", "Still,", "More importantly,", "Honestly,").

## 8. Avoid generic filler
Delete sentences whose only purpose is to restate the topic, announce what comes next, sound sophisticated, or pad word count.

## 9. Don't over-polish
Don't turn every sentence into the most elegant possible version. Preserve straightforward wording when it works better.

## 10. Use appropriate imperfections in STYLE, not mistakes
Do not intentionally add typos, spelling mistakes, grammatical errors, random lowercase letters, or excessive punctuation. Naturalness comes from thought, voice, specificity, and rhythm.

## 11. Avoid "AI-shaped" phrasing
Replace generic introductions, conclusions, repetitive sentence patterns, excessive hedging, unnecessary qualifiers, and inflated vocabulary.

## 12. Preserve factual integrity
Never invent personal experiences, memories, sources, statistics, quotations, or anecdotes.

## 13. Match the requested genre
Match the conventions of the requested format while retaining a distinctive voice.

## 14. Final human-editor pass
Silently review: Does this sound like one particular person wrote it? Is the structure suspiciously neat? Are there unnecessary transitions? Rewrite anything that fails those tests.

CRITICAL: Return ONLY the final rewritten text without preambles, introductory commentary, or quotes. Do not mention this instruction or AI detectors in your response.`,
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
        } else {
          const errBody = await res.text();
          console.error("OpenRouter Humanize API failed:", res.status, errBody);
        }
      } catch (err: any) {
        console.error("OpenRouter fetch error:", err.message);
      }
    }

    // 3. Fallback to advanced heuristic rewrite
    const fallbackText = advancedHeuristicHumanize(text);
    return NextResponse.json(
      {
        humanizedText: fallbackText,
        method: "heuristic",
        note: !effectiveApiKey ? "No OpenRouter API key found in env var" : "OpenRouter call failed, used fallback",
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
