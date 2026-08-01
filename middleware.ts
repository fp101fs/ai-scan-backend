import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function middleware() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.redirect(new URL("/", process.env.VERCEL_URL || "http://localhost:3000"));
  }
}

export const runtime = "nodejs";