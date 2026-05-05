import { createAdminClient } from "@/lib/supabase/admin";

export async function createAllowedAlerts(userId: string, metricDate: string, statusLabel: string) {
  if (statusLabel !== "Needs Rest") return 0;

  const admin = createAdminClient();
  const { data: privacy } = await admin
    .from("member_privacy_settings")
    .select("alerts_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (!privacy?.alerts_enabled) return 0;

  const { data: memberships, error } = await admin
    .from("family_memberships")
    .select("family_id,display_name")
    .eq("user_id", userId);

  if (error) throw error;
  if (!memberships?.length) return 0;

  const rows = memberships.map((membership) => ({
    user_id: userId,
    family_id: membership.family_id,
    metric_date: metricDate,
    alert_type: "low_recovery",
    message: `${membership.display_name}'s recovery looks low today.`
  }));

  const { error: alertError } = await admin
    .from("alert_events")
    .upsert(rows, { onConflict: "user_id,family_id,metric_date,alert_type" });
  if (alertError) throw alertError;
  return rows.length;
}
