import { ConnectProviderButtons } from "@/components/ConnectProviderButtons";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { normalizeDailyMetric } from "@/lib/normalization";
import { createClient } from "@/lib/supabase/server";
import type {
  DailyMetricInput,
  FamilyMemberSummary,
  MetricPrivacy,
  Provider
} from "@/lib/types";
import { CircleAlert, Database, LogIn } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DailyMetricRow = {
  user_id: string;
  provider: Provider;
  metric_date: string;
  recovery_score: number | null;
  readiness_score: number | null;
  sleep_score: number | null;
  sleep_performance: number | null;
  hrv_rmssd_ms: number | null;
  resting_heart_rate_bpm: number | null;
  strain_score: number | null;
  activity_score: number | null;
  recovery_index: number | null;
  sleep_index: number | null;
  activity_index: number | null;
  status_label: "Recovered" | "Normal" | "Needs Rest" | "Unknown" | string;
};

type ProviderConnectionRow = {
  provider: Provider;
};

type FamilySummaryRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  providers: Provider[] | null;
  recovery_visibility: MetricPrivacy["recovery"];
  sleep_visibility: MetricPrivacy["sleep"];
  hrv_visibility: MetricPrivacy["hrv"];
  resting_heart_rate_visibility: MetricPrivacy["restingHeartRate"];
  activity_visibility: MetricPrivacy["activity"];
  alerts_enabled: boolean;
  today: {
    provider?: Provider;
    metric_date?: string;
    recovery_index?: number | null;
    sleep_index?: number | null;
    hrv_rmssd_ms?: number | null;
    resting_heart_rate_bpm?: number | null;
    activity_index?: number | null;
    status_label?: string;
  } | null;
};

const exactPrivacy: MetricPrivacy = {
  recovery: "exact",
  sleep: "exact",
  hrv: "exact",
  restingHeartRate: "exact",
  activity: "exact",
  alertsEnabled: false
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metricInputFromRow(row: DailyMetricRow): DailyMetricInput {
  return {
    provider: row.provider,
    date: row.metric_date,
    recoveryScore: row.recovery_score,
    readinessScore: row.readiness_score,
    sleepScore: row.sleep_score,
    sleepPerformance: row.sleep_performance,
    hrvRmssdMs: row.hrv_rmssd_ms,
    restingHeartRateBpm: row.resting_heart_rate_bpm,
    strainScore: row.strain_score,
    activityScore: row.activity_score
  };
}

function rowHasMetricData(row: DailyMetricRow) {
  return [
    row.recovery_score,
    row.readiness_score,
    row.sleep_score,
    row.sleep_performance,
    row.hrv_rmssd_ms,
    row.resting_heart_rate_bpm,
    row.strain_score,
    row.activity_score,
    row.recovery_index,
    row.sleep_index,
    row.activity_index
  ].some((value) => typeof value === "number");
}

function memberFromDailyMetric({
  row,
  displayName,
  providers,
  trends
}: {
  row: DailyMetricRow;
  displayName: string;
  providers: Provider[];
  trends: FamilyMemberSummary["trends"];
}): FamilyMemberSummary {
  const normalized = normalizeDailyMetric(metricInputFromRow(row));

  return {
    id: row.user_id,
    displayName,
    providers,
    privacy: exactPrivacy,
    today: {
      ...normalized,
      recoveryIndex: row.recovery_index ?? normalized.recoveryIndex,
      sleepIndex: row.sleep_index ?? normalized.sleepIndex,
      activityIndex: row.activity_index ?? normalized.activityIndex,
      status:
        row.status_label === "Recovered" ||
        row.status_label === "Normal" ||
        row.status_label === "Needs Rest" ||
        row.status_label === "Unknown"
          ? row.status_label
          : normalized.status
    },
    trends
  };
}

function memberFromFamilySummary(row: FamilySummaryRow): FamilyMemberSummary {
  return {
    id: row.user_id,
    displayName: row.display_name ?? "Family member",
    avatarUrl: row.avatar_url,
    providers: row.providers ?? [],
    privacy: {
      recovery: row.recovery_visibility,
      sleep: row.sleep_visibility,
      hrv: row.hrv_visibility,
      restingHeartRate: row.resting_heart_rate_visibility,
      activity: row.activity_visibility,
      alertsEnabled: row.alerts_enabled
    },
    today: row.today
      ? {
          provider: row.today.provider ?? "oura",
          date: row.today.metric_date ?? new Date().toISOString().slice(0, 10),
          recoveryIndex: numberOrNull(row.today.recovery_index),
          sleepIndex: numberOrNull(row.today.sleep_index),
          activityIndex: numberOrNull(row.today.activity_index),
          hrvRmssdMs: numberOrNull(row.today.hrv_rmssd_ms),
          restingHeartRateBpm: numberOrNull(row.today.resting_heart_rate_bpm),
          status:
            row.today.status_label === "Recovered" ||
            row.today.status_label === "Normal" ||
            row.today.status_label === "Needs Rest" ||
            row.today.status_label === "Unknown"
              ? row.today.status_label
              : "Unknown"
        }
      : null,
    trends: {
      hrv: [],
      restingHeartRate: []
    }
  };
}

function displayNameForUser(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  return "Van";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  let members: FamilyMemberSummary[] = [];
  let queryError: string | null = userError?.message ?? null;

  if (user) {
    const { data: familyRows, error: familyError } = await supabase
      .from("family_dashboard_summary")
      .select("*")
      .order("display_name");

    if (familyError) {
      queryError = familyError.message;
    } else if (familyRows?.length) {
      members = (familyRows as FamilySummaryRow[])
        .map(memberFromFamilySummary)
        .filter((member) => member.today !== null);
    }

    if (!queryError) {
      const [{ data: latestRows, error: metricsError }, { data: connectionRows, error: connectionError }] =
        await Promise.all([
          supabase
            .from("daily_metrics")
            .select(
              "user_id,provider,metric_date,recovery_score,readiness_score,sleep_score,sleep_performance,hrv_rmssd_ms,resting_heart_rate_bpm,strain_score,activity_score,recovery_index,sleep_index,activity_index,status_label"
            )
            .eq("user_id", user.id)
            .order("metric_date", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(30),
          supabase.from("provider_connections").select("provider").eq("user_id", user.id)
        ]);

      if (metricsError) {
        queryError = metricsError.message;
      } else if (connectionError) {
        queryError = connectionError.message;
      } else if (latestRows?.length) {
        const rows = latestRows as DailyMetricRow[];
        const latest =
          rows.find((row) => row.provider === "oura" && rowHasMetricData(row)) ??
          rows.find(rowHasMetricData) ??
          rows.find((row) => row.provider === "oura") ??
          rows[0];

        const providerRows = (connectionRows ?? []) as ProviderConnectionRow[];
        const providers = providerRows.map((connection) => connection.provider);

        const ownMember = memberFromDailyMetric({
          row: latest,
          displayName: displayNameForUser(user),
          providers: providers.length ? providers : [latest.provider],
          trends: {
            hrv: rows
              .map((row) => row.hrv_rmssd_ms)
              .filter((value): value is number => typeof value === "number")
              .reverse(),
            restingHeartRate: rows
              .map((row) => row.resting_heart_rate_bpm)
              .filter((value): value is number => typeof value === "number")
              .reverse()
          }
        });

        const existingIndex = members.findIndex((member) => member.id === user.id);
        if (existingIndex >= 0) {
          members[existingIndex] = ownMember;
        } else {
          members = [ownMember, ...members];
        }
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-5 rounded-lg border border-white/70 bg-white/55 p-5 shadow-soft backdrop-blur md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-clay">Private family wellness</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Today&apos;s recovery picture, shared with consent.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-moss">
            Oura and WHOOP data land in one family view, normalized into simple readiness,
            sleep, HRV, heart rate, and activity signals.
          </p>
        </div>
        <ConnectProviderButtons />
      </header>

      {queryError ? <ErrorState message={queryError} /> : null}

      {!user ? (
        <EmptyState
          icon="login"
          title="Sign in to see wellness data"
          body="Once you sign in, this page will load your connected Oura and WHOOP metrics from Supabase."
          actionHref="/login"
          actionLabel="Sign in"
        />
      ) : !queryError && members.length === 0 ? (
        <EmptyState
          icon="database"
          title="No metrics synced yet"
          body="Connect Oura or WHOOP from settings, then run the daily sync. Your latest row from daily_metrics will appear here."
          actionHref="/settings"
          actionLabel="Open settings"
        />
      ) : null}

      {members.length > 0 ? (
        <section className="grid gap-4">
          {members.map((member) => (
            <FamilyMemberCard key={member.id} member={member} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-coral/40 bg-coral/15 p-5 text-ink">
      <div className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden className="h-5 w-5" />
        Could not load dashboard data
      </div>
      <p className="mt-2 text-sm leading-6 text-moss">{message}</p>
    </section>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionHref,
  actionLabel
}: {
  icon: "login" | "database";
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  const Icon = icon === "login" ? LogIn : Database;

  return (
    <section className="rounded-lg border border-white/70 bg-white/70 p-8 text-center shadow-soft backdrop-blur">
      <Icon aria-hidden className="mx-auto h-10 w-10 text-clay" />
      <h2 className="mt-4 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-moss">{body}</p>
      <Link
        className="mt-5 inline-flex rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        href={actionHref}
      >
        {actionLabel}
      </Link>
    </section>
  );
}
