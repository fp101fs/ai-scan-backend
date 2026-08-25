import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth";
import { NextResponse } from "next/server";
import { getOpenRouterKeyInfo, getOpenRouterKeyHash } from "../../../../lib/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const apiKey = user.openRouterKey;

  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      isServerFallback: Boolean(process.env.OPENROUTER_API_KEY),
    });
  }

  const keyInfo = await getOpenRouterKeyInfo(apiKey);
  const keyHash = getOpenRouterKeyHash(apiKey);

  return NextResponse.json({
    connected: true,
    keyLabel: keyInfo?.label || user.keyLabel || "OpenRouter Key",
    keyHash,
    usage: keyInfo?.usage ?? user.usage ?? 0,
    limit: keyInfo?.limit ?? user.limit ?? null,
    isFreeTier: keyInfo?.is_free_tier ?? user.isFreeTier ?? false,
    logsUrl: `https://openrouter.ai/logs?api_key_hash=${keyHash}`,
    settingsUrl: `https://openrouter.ai/keys/${keyHash}`,
  });
}
