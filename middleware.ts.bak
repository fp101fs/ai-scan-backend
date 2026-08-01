import { authOptions } from "@/auth";
import { getServerSession } from "next-auth/next";

export async function middleware() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.redirect(
      new URL("/", process.env.VERCEL_URL || "http://localhost:3000")
    );
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};