import { encryptSecret } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Provider } from "@/lib/types";

export async function storeProviderToken({
  userId,
  provider,
  accessToken,
  refreshToken,
  expiresInSeconds,
  scopes
}: {
  userId: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  scopes?: string;
}) {
  const admin = createAdminClient();

  const expiresAt =
    typeof expiresInSeconds === "number"
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : null;

  const { error } = await admin.from("provider_connections").upsert(
    {
      user_id: userId,
      provider,
      encrypted_access_token: encryptSecret(accessToken),
      encrypted_refresh_token: refreshToken ? encryptSecret(refreshToken) : null,
      token_expires_at: expiresAt,
      scopes: scopes ? scopes.split(" ") : [],
      connected_at: new Date().toISOString(),
      status: "connected"
    },
    { onConflict: "user_id,provider" }
  );

  if (error) throw error;
}
