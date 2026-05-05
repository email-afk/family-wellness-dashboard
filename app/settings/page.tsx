import { ConnectProviderButtons } from "@/components/ConnectProviderButtons";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, CircleAlert, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

type ProviderConnectionRow = {
  provider: "oura" | "whoop";
  status: string;
  connected_at: string | null;
  last_synced_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  let connections: ProviderConnectionRow[] = [];
  let queryError: string | null = userError?.message ?? null;

  if (user) {
    const { data, error } = await supabase
      .from("provider_connections")
      .select("provider,status,connected_at,last_synced_at")
      .eq("user_id", user.id)
      .order("provider");

    if (error) {
      queryError = error.message;
    } else {
      connections = (data ?? []) as ProviderConnectionRow[];
    }
  }

  const oura = connections.find((connection) => connection.provider === "oura");
  const whoop = connections.find((connection) => connection.provider === "whoop");

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-normal text-ink">Connections and privacy</h1>
      <p className="mt-3 text-moss">
        Connect each wearable from the signed-in family member&apos;s account, then choose what
        relatives can see. Exact controls are backed by the `member_privacy_settings` table.
      </p>

      {!user ? (
        <div className="mt-6 rounded-lg border border-coral/40 bg-coral/15 p-4 text-ink">
          Sign in before connecting Oura or WHOOP.
        </div>
      ) : null}

      {queryError ? (
        <div className="mt-6 rounded-lg border border-coral/40 bg-coral/15 p-4 text-ink">
          <div className="flex items-center gap-2 font-semibold">
            <CircleAlert aria-hidden className="h-4 w-4" />
            Could not load provider connections
          </div>
          <p className="mt-2 text-sm text-moss">{queryError}</p>
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-white/70 bg-white/70 p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProviderConnectionCard provider="oura" connection={oura} />
          <ProviderConnectionCard provider="whoop" connection={whoop} />
        </div>
        <div className="mt-5">
          <ConnectProviderButtons />
        </div>
      </div>
    </main>
  );
}

function ProviderConnectionCard({
  provider,
  connection
}: {
  provider: "oura" | "whoop";
  connection?: ProviderConnectionRow;
}) {
  const label = provider === "oura" ? "Oura" : "WHOOP";
  const isConnected = connection?.status === "connected";

  return (
    <section className="rounded-lg border border-white/80 bg-paper/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{label}</h2>
          <p className="mt-1 text-sm text-moss">
            {isConnected ? `${label} connected` : `${label} not connected`}
          </p>
        </div>
        {isConnected ? (
          <CheckCircle2 aria-label={`${label} connected`} className="h-5 w-5 text-moss" />
        ) : (
          <Link2 aria-label={`${label} not connected`} className="h-5 w-5 text-clay" />
        )}
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-moss">Status</dt>
          <dd className="font-medium text-ink">{connection?.status ?? "not connected"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-moss">Last sync</dt>
          <dd className="font-medium text-ink">{formatDate(connection?.last_synced_at ?? null)}</dd>
        </div>
      </dl>
    </section>
  );
}