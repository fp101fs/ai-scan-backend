import crypto from "crypto";

export const OPENROUTER_AUTH_URL = "https://openrouter.ai/auth";
export const OPENROUTER_KEYS_URL = "https://openrouter.ai/api/v1/auth/keys";
export const OPENROUTER_KEY_INFO_URL = "https://openrouter.ai/api/v1/auth/key";
export const OPENROUTER_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export interface OpenRouterKeyInfo {
  label: string;
  usage: number;
  limit: number | null;
  is_free_tier: boolean;
  rate_limit?: {
    requests: number;
    interval: string;
  };
}

/**
 * Base64URL encoder without padding
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates a PKCE code_verifier and code_challenge using SHA-256
 */
export function generatePKCE(): PKCEPair {
  const verifierBytes = crypto.randomBytes(32);
  const codeVerifier = base64UrlEncode(verifierBytes);

  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hash);

  return { codeVerifier, codeChallenge };
}

/**
 * Constructs the OpenRouter OAuth authorization URL
 */
export function getOpenRouterAuthUrl(
  callbackUrl: string,
  codeChallenge?: string
): string {
  const url = new URL(OPENROUTER_AUTH_URL);
  url.searchParams.set("callback_url", callbackUrl);

  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  return url.toString();
}

/**
 * Exchanges the authorization code received from OpenRouter for an API key
 */
export async function exchangeCodeForApiKey(
  code: string,
  codeVerifier?: string
): Promise<string> {
  const payload: Record<string, string> = { code };

  if (codeVerifier) {
    payload.code_verifier = codeVerifier;
    payload.code_challenge_method = "S256";
  }

  const response = await fetch(OPENROUTER_KEYS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to exchange OpenRouter code (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  if (!data?.key) {
    throw new Error("No API key returned from OpenRouter OAuth");
  }

  return data.key;
}

/**
 * Computes the SHA-256 hex hash of the API key for deep-linking to user logs and key settings
 */
export function getOpenRouterKeyHash(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Fetches metadata and usage about the provided OpenRouter API key
 */
export async function getOpenRouterKeyInfo(
  apiKey: string
): Promise<OpenRouterKeyInfo | null> {
  try {
    const response = await fetch(OPENROUTER_KEY_INFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) return null;

    const json = await response.json();
    const data = json?.data;
    if (!data) return null;

    return {
      label: data.label || "OpenRouter Key",
      usage: typeof data.usage === "number" ? data.usage : 0,
      limit: typeof data.limit === "number" ? data.limit : null,
      is_free_tier: Boolean(data.is_free_tier),
      rate_limit: data.rate_limit,
    };
  } catch (err) {
    console.error("Error fetching OpenRouter key info:", err);
    return null;
  }
}
