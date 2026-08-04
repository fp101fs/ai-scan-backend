import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/auth/token
 * 
 * The Chrome extension sends a Google access token obtained via
 * chrome.identity.getAuthToken(). This endpoint validates it
 * against Google's userinfo API and returns a signed JWT the
 * extension can use as a Bearer token for /api/scan requests.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { googleToken } = body;

    if (!googleToken) {
      return NextResponse.json(
        { error: "googleToken is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate the Google token by calling Google's userinfo endpoint
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { error: "Invalid Google token" },
        { status: 401, headers: corsHeaders }
      );
    }

    const profile = await googleRes.json();

    // Create a signed JWT for the extension to use
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server auth not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const token = await encode({
      token: {
        sub: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json(
      {
        token,
        user: {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        },
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    console.error("Token exchange error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
