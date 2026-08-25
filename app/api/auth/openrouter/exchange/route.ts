import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import {
  exchangeCodeForApiKey,
  getOpenRouterKeyInfo,
  getOpenRouterKeyHash,
} from "../../../../../lib/openrouter";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/auth/openrouter/exchange
 * Exchanges an OpenRouter OAuth PKCE code from the Chrome Extension or API client
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, codeVerifier } = body;

    if (!code) {
      return NextResponse.json(
        { error: "code is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = await exchangeCodeForApiKey(code, codeVerifier);
    const keyInfo = await getOpenRouterKeyInfo(apiKey);
    const keyHash = getOpenRouterKeyHash(apiKey);

    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "ai-scan-secret-production-key-9284102941";

    const token = await encode({
      token: {
        sub: `openrouter_${keyHash.slice(0, 16)}`,
        name: keyInfo?.label || "OpenRouter User",
        email: `${keyHash.slice(0, 8)}@openrouter.auth`,
        picture: "https://openrouter.ai/favicon.ico",
        openRouterKey: apiKey,
        openRouterKeyHash: keyHash,
        keyLabel: keyInfo?.label || "OpenRouter Key",
        usage: keyInfo?.usage ?? 0,
        limit: keyInfo?.limit ?? null,
        isFreeTier: keyInfo?.is_free_tier ?? false,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json(
      {
        token,
        openRouterKey: apiKey,
        openRouterKeyHash: keyHash,
        user: {
          name: keyInfo?.label || "OpenRouter User",
          email: `${keyHash.slice(0, 8)}@openrouter.auth`,
          usage: keyInfo?.usage ?? 0,
          limit: keyInfo?.limit ?? null,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("OpenRouter extension exchange error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to exchange OpenRouter code" },
      { status: 500, headers: corsHeaders }
    );
  }
}
