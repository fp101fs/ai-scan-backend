import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getOpenRouterKeyInfo,
  getOpenRouterKeyHash,
} from "./lib/openrouter";

export const authOptions: AuthOptions = {
  providers: [
    // OpenRouter primary OAuth / API Key Provider
    CredentialsProvider({
      id: "openrouter",
      name: "OpenRouter",
      credentials: {
        apiKey: { label: "OpenRouter API Key", type: "password" },
      },
      async authorize(credentials) {
        const apiKey = credentials?.apiKey?.trim();
        if (!apiKey) return null;

        // Verify key against OpenRouter API
        const keyInfo = await getOpenRouterKeyInfo(apiKey);
        const keyHash = getOpenRouterKeyHash(apiKey);

        return {
          id: `openrouter_${keyHash.slice(0, 16)}`,
          name: keyInfo?.label || "OpenRouter User",
          email: `${keyHash.slice(0, 8)}@openrouter.auth`,
          image: "https://openrouter.ai/favicon.ico",
          openRouterKey: apiKey,
          openRouterKeyHash: keyHash,
          keyLabel: keyInfo?.label || "OpenRouter Key",
          usage: keyInfo?.usage ?? 0,
          limit: keyInfo?.limit ?? null,
          isFreeTier: keyInfo?.is_free_tier ?? false,
        } as any;
      },
    }),
    // Optional Google OAuth Provider
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "ai-scan-secret-production-key-9284102941",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.openRouterKey = (user as any).openRouterKey;
        token.openRouterKeyHash = (user as any).openRouterKeyHash;
        token.keyLabel = (user as any).keyLabel;
        token.usage = (user as any).usage;
        token.limit = (user as any).limit;
        token.isFreeTier = (user as any).isFreeTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).openRouterKey = token.openRouterKey;
        (session.user as any).openRouterKeyHash = token.openRouterKeyHash;
        (session.user as any).keyLabel = token.keyLabel;
        (session.user as any).usage = token.usage;
        (session.user as any).limit = token.limit;
        (session.user as any).isFreeTier = token.isFreeTier;
        (session.user as any).hasOpenRouter = Boolean(
          token.openRouterKey || process.env.OPENROUTER_API_KEY
        );
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/openrouter/login",
  },
};