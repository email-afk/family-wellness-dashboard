import { decryptSecret } from "@/lib/crypto";
import { normalizeDailyMetric } from "@/lib/normalization";
import { fetchOuraDailyMetrics } from "@/lib/providers/oura";
import { fetchWhoopDailyMetrics } from "@/lib/providers/whoop";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAllowedAlerts } from "@/lib/sync/alerts";

import { NextRequest, NextResponse } from "next/server";

async function updateProviderLastSyncedAt(
  admin: ReturnType<typeof createAdminClient>,
  connectionId: string,
  syncedAt: string
) {
  const { error } = await admin
    .from("provider_connections")
    .update({ last_synced_at: syncedAt })
    .eq("id", connectionId);

  if (!error) return;

  const fallback = await admin
    .from("provider_connections")
    .update({ last_sync_at: syncedAt })
    .eq("id", connectionId);

  if (fallback.error) throw error;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connections, error } = await admin
    .from("provider_connections")
    .select("id,user_id,provider,encrypted_access_token")
    .eq("status", "connected");

  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const start = `${today}T00:00:00.000Z`;
  const end = `${today}T23:59:59.999Z`;
  let synced = 0;
  let alerts = 0;

  for (const connection of connections ?? []) {
    const accessToken = decryptSecret(connection.encrypted_access_token);
    const syncedAt = new Date().toISOString();

    const rawMetrics =
      connection.provider === "oura"
        ? await fetchOuraDailyMetrics(accessToken, today)
        : await fetchWhoopDailyMetrics(accessToken, start, end);

    for (const rawMetric of rawMetrics) {
      const metric = normalizeDailyMetric(rawMetric);

      const { error: metricError } = await admin.from("daily_metrics").upsert(
        {
          user_id: connection.user_id,
          provider: connection.provider as "oura" | "whoop",
          metric_date: metric.date,
recovery_score: metric.recoveryScore ?? metric.recoveryIndex,
readiness_score: metric.readinessScore ?? null,
sleep_score: metric.sleepScore ?? metric.sleepIndex,
sleep_performance: metric.sleepPerformance ?? null,
          hrv_rmssd_ms: metric.hrvRmssdMs,
          resting_heart_rate_bpm: metric.restingHeartRateBpm,
          strain_score: metric.strainScore,
          activity_score: metric.activityScore,
          recovery_index: metric.recoveryIndex,
          sleep_index: metric.sleepIndex,
          activity_index: metric.activityIndex,
          status_label: metric.status,
          source_payload: metric.sourcePayload ?? rawMetric,
          updated_at: syncedAt
        },
        { onConflict: "user_id,provider,metric_date" }
      );

      if (metricError) throw metricError;

      alerts += await createAllowedAlerts(connection.user_id, metric.date, metric.status ?? "Unknown");
      synced += 1;
    }

    await updateProviderLastSyncedAt(admin, connection.id, syncedAt);
  }

  return NextResponse.json({ synced, alerts });
}
