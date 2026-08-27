import { NextRequest, NextResponse } from "next/server";
import { generatePKCE, getOpenRouterAuthUrl } from "../../../../../lib/openrouter";

export const dynamic = "force-dynamic";

/**
 * Initiates OpenRouter OAuth PKCE flow
 * GET /api/auth/openrouter/login
 */
export async function GET(req: NextRequest) {
  try {
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Determine base URL dynamically from request host
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
    const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || "https://aidetector.buzz");

    const callbackUrl = `${baseUrl}/api/auth/openrouter/callback`;
    const authUrl = getOpenRouterAuthUrl(callbackUrl, codeChallenge);

    // Save code_verifier in secure cookie
    const response = NextResponse.redirect(authUrl);

    const isSecure = baseUrl.startsWith("https://");
    response.cookies.set("openrouter_pkce_verifier", codeVerifier, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (err: any) {
    console.error("OpenRouter login initiation error:", err);
    return NextResponse.json(
      { error: "Failed to initiate OpenRouter OAuth flow" },
      { status: 500 }
    );
  }
}
