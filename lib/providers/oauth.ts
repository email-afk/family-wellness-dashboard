import { randomState } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { Provider } from "@/lib/types";

export type OAuthConfig = {
  provider: Provider;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

export function getOAuthConfig(provider: Provider): OAuthConfig {
  if (provider === "oura") {
    return {
      provider,
      authorizeUrl: "https://cloud.ouraring.com/oauth/authorize",
      tokenUrl: "https://api.ouraring.com/oauth/token",
      clientId: process.env.OURA_CLIENT_ID!,
      clientSecret: process.env.OURA_CLIENT_SECRET!,
      redirectUri: process.env.OURA_REDIRECT_URI!,
      scopes: ["daily", "heartrate", "workout", "email"]
    };
  }

  return {
    provider,
    authorizeUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    clientId: process.env.WHOOP_CLIENT_ID!,
    clientSecret: process.env.WHOOP_CLIENT_SECRET!,
    redirectUri: process.env.WHOOP_REDIRECT_URI!,
    scopes: ["offline", "read:profile", "read:recovery", "read:cycles", "read:sleep", "read:workout"]
  };
}

export async function createAuthorizationRedirect(provider: Provider) {
  const config = getOAuthConfig(provider);
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in before connecting a wearable account");
  }

  const state = randomState();
  const admin = createAdminClient();
  const { error: stateError } = await admin.from("oauth_states").insert({
    user_id: user.id,
    provider,
    state,
    redirect_uri: config.redirectUri,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });

  if (stateError) throw stateError;

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeCodeForToken(config: OAuthConfig, code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri
  });

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${config.provider} token exchange failed: ${response.status} ${details}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
}
