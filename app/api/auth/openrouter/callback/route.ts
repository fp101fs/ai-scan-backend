import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import {
  exchangeCodeForApiKey,
  getOpenRouterKeyInfo,
  getOpenRouterKeyHash,
} from "../../../../../lib/openrouter";

export const dynamic = "force-dynamic";

/**
 * Handles OpenRouter OAuth callback
 * GET /api/auth/openrouter/callback?code=...
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;

  if (error || !code) {
    const errorMsg = error || "No authorization code provided";
    console.error("OpenRouter OAuth callback error:", errorMsg);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(errorMsg)}`);
  }

  try {
    const codeVerifier = req.cookies.get("openrouter_pkce_verifier")?.value;
    const apiKey = await exchangeCodeForApiKey(code, codeVerifier);

    const keyInfo = await getOpenRouterKeyInfo(apiKey);
    const keyHash = getOpenRouterKeyHash(apiKey);

    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "ai-scan-secret-production-key-9284102941";

    const sessionJwt = await encode({
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
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    const isSecure = baseUrl.startsWith("https://");
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.redirect(`${baseUrl}/dashboard?auth=openrouter_success`);

    // Set NextAuth session cookie
    response.cookies.set(cookieName, sessionJwt, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear the verifier cookie
    response.cookies.delete("openrouter_pkce_verifier");

    return response;
  } catch (err: any) {
    console.error("OpenRouter code exchange failed:", err);
    return NextResponse.redirect(
      `${baseUrl}/?error=${encodeURIComponent(err.message || "Failed to authenticate with OpenRouter")}`
    );
  }
}
