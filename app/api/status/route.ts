import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authHeader = req.headers.get("authorization");

  const sessionUser = session?.user as any;
  const hasUserKey = Boolean(sessionUser?.openRouterKey);
  const hasServerKey = Boolean(process.env.OPENROUTER_API_KEY);

  return NextResponse.json(
    {
      status: "ok",
      authenticated: !!(session || authHeader?.startsWith("Bearer ")),
      authMethod: hasUserKey ? "openrouter_oauth" : session?.user ? "google" : "none",
      openrouterConfigured: hasUserKey || hasServerKey,
      openrouterKeyType: hasUserKey ? "user_oauth" : hasServerKey ? "server_managed" : "none",
      heuristicEngineReady: true,
      supportedModes: ["openrouter", "hybrid", "heuristic"],
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
