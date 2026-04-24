import { createClient } from "supabase-js";

export type MetaOAuthAccount = {
  id: string;
  accountId: string;
  name: string;
  currency?: string;
  accountStatus?: number;
};

type OAuthStatePayload = {
  userId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

const META_GRAPH_VERSION = "v19.0";
const DEFAULT_SCOPES = ["ads_read", "business_management"];
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const toJsonBase64 = (payload: unknown) => bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)));

const fromJsonBase64 = <T>(payload: string): T => JSON.parse(textDecoder.decode(base64UrlToBytes(payload))) as T;

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
};

export const createSupabaseAdmin = () => {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseServiceKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, supabaseServiceKey);
};

export const getMetaConfig = () => ({
  appId: getRequiredEnv("META_APP_ID"),
  appSecret: getRequiredEnv("META_APP_SECRET"),
  redirectUri: getRequiredEnv("META_REDIRECT_URI"),
  stateSecret: Deno.env.get("META_OAUTH_STATE_SECRET") || getRequiredEnv("META_APP_SECRET"),
});

export const normalizeMetaAccountId = (value: string) => value.trim().replace(/^act_/, "");

export const createMetaOAuthState = async (userId: string) => {
  const { stateSecret } = getMetaConfig();
  const payload: OAuthStatePayload = {
    userId,
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const encodedPayload = toJsonBase64(payload);
  const signatureKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(stateSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", signatureKey, textEncoder.encode(encodedPayload));
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
};

export const verifyMetaOAuthState = async (state: string) => {
  const { stateSecret } = getMetaConfig();
  const [payloadPart, signaturePart] = state.split(".");
  if (!payloadPart || !signaturePart) return null;

  const signatureKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(stateSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const verified = await crypto.subtle.verify(
    "HMAC",
    signatureKey,
    base64UrlToBytes(signaturePart),
    textEncoder.encode(payloadPart),
  );

  if (!verified) return null;

  const payload = fromJsonBase64<OAuthStatePayload>(payloadPart);
  if (!payload?.userId || payload.expiresAt < Date.now()) return null;
  return payload;
};

export const buildMetaOAuthUrl = async (userId: string) => {
  const { appId, redirectUri } = getMetaConfig();
  const state = await createMetaOAuthState(userId);
  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DEFAULT_SCOPES.join(","));
  url.searchParams.set("state", state);
  return { authorizationUrl: url.toString(), state };
};

export const exchangeMetaOAuthCode = async (code: string) => {
  const { appId, appSecret, redirectUri } = getMetaConfig();
  const baseUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`;

  const exchangeToken = async (params: Record<string, string>) => {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || "Meta OAuth token exchange failed.");
    }

    return payload as { access_token: string; expires_in?: number };
  };

  const shortLived = await exchangeToken({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const longLived = await exchangeToken({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLived.access_token,
  });

  const userRes = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/me?fields=id,name&access_token=${longLived.access_token}`);
  const userJson = await userRes.json().catch(() => ({}));
  if (!userRes.ok || userJson?.error) {
    throw new Error(userJson?.error?.message || "Failed to fetch Meta profile.");
  }

  const accountsRes = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts?fields=id,name,account_id,currency,account_status&limit=100&access_token=${longLived.access_token}`);
  const accountsJson = await accountsRes.json().catch(() => ({}));
  if (!accountsRes.ok || accountsJson?.error) {
    throw new Error(accountsJson?.error?.message || "Failed to fetch Meta ad accounts.");
  }

  const accounts = Array.isArray(accountsJson?.data)
    ? accountsJson.data.map((account: Record<string, unknown>) => {
        const rawId = String(account.account_id || account.id || "");
        const normalizedId = normalizeMetaAccountId(rawId);
        return {
          id: String(account.id || `act_${normalizedId}`),
          accountId: normalizedId,
          name: String(account.name || normalizedId),
          currency: typeof account.currency === "string" ? account.currency : undefined,
          accountStatus: typeof account.account_status === "number" ? account.account_status : undefined,
        } satisfies MetaOAuthAccount;
      })
    : [];

  return {
    token: longLived.access_token,
    expiresIn: typeof longLived.expires_in === "number" ? longLived.expires_in : null,
    metaUser: {
      id: String(userJson.id || ""),
      name: String(userJson.name || ""),
    },
    accounts,
  };
};
