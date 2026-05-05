import { exchangeCodeForToken, getOAuthConfig } from "@/lib/providers/oauth";
import { storeProviderToken } from "@/lib/providers/store-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const provider = "whoop";
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;

  if (error) return NextResponse.redirect(`${appUrl}/settings?provider=${provider}&error=${error}`);
  if (!code || !state) {
    return NextResponse.json({ error: "Missing OAuth code or state" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: storedState, error: stateError } = await admin
    .from("oauth_states")
    .select("id,user_id,expires_at,provider")
    .eq("state", state)
    .eq("provider", provider)
    .maybeSingle();

  if (stateError || !storedState || new Date(storedState.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(getOAuthConfig(provider), code);
  await storeProviderToken({
    userId: storedState.user_id,
    provider,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresInSeconds: token.expires_in,
    scopes: token.scope
  });

  await admin.from("oauth_states").delete().eq("id", storedState.id);
  return NextResponse.redirect(`${appUrl}/settings?provider=${provider}&connected=1`);
}
