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

  return NextResponse.json(
    {
      status: "ok",
      authenticated: !!(session || authHeader?.startsWith("Bearer ")),
      openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
