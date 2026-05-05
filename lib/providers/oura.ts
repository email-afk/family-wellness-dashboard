import type { DailyMetricInput } from "@/lib/types";

const OURA_API_BASE = "https://api.ouraring.com/v2";

async function ouraGet<T>(path: string, accessToken: string) {
  const response = await fetch(`${OURA_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Oura request failed: ${response.status} ${details}`);
  }

  return (await response.json()) as T;
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function latestByDay<T extends { day?: string }>(items: T[] = []) {
  return [...items]
    .filter((item) => item.day)
    .sort((a, b) => String(b.day).localeCompare(String(a.day)))[0];
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type OuraDailyReadiness = {
  id?: string;
  day: string;
  score?: number | null;
  contributors?: Record<string, number | null | undefined>;
};

type OuraDailySleep = {
  id?: string;
  day: string;
  score?: number | null;
  contributors?: Record<string, number | null | undefined>;
};

type OuraDailyActivity = {
  id?: string;
  day: string;
  score?: number | null;
  active_calories?: number | null;
  steps?: number | null;
  contributors?: Record<string, number | null | undefined>;
};

type OuraSleep = {
  id?: string;
  day: string;
  average_heart_rate?: number | null;
  average_hrv?: number | null;
  lowest_heart_rate?: number | null;
  heart_rate?: {
    items?: Array<number | null>;
  };
  hrv?: {
    items?: Array<number | null>;
  };
};

function averageNumericItems(items: Array<number | null> | undefined) {
  const numbers = (items ?? []).filter((value): value is number => typeof value === "number");
  if (!numbers.length) return null;

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function uniqueDays(...groups: Array<Array<{ day?: string }>>) {
  return Array.from(
    new Set(
      groups.flatMap((group) =>
        group.map((item) => item.day).filter((day): day is string => Boolean(day))
      )
    )
  ).sort((a, b) => b.localeCompare(a));
}

export async function fetchOuraDailyMetrics(
  accessToken: string,
  date: string
): Promise<DailyMetricInput[]> {
  const startDate = addDays(date, -7);

  const [dailySleep, dailyReadiness, dailyActivity, sleepPeriods] = await Promise.all([
    ouraGet<{ data: OuraDailySleep[] }>(
      `/usercollection/daily_sleep?start_date=${startDate}&end_date=${date}`,
      accessToken
    ),
    ouraGet<{ data: OuraDailyReadiness[] }>(
      `/usercollection/daily_readiness?start_date=${startDate}&end_date=${date}`,
      accessToken
    ),
    ouraGet<{ data: OuraDailyActivity[] }>(
      `/usercollection/daily_activity?start_date=${startDate}&end_date=${date}`,
      accessToken
    ),
    ouraGet<{ data: OuraSleep[] }>(
      `/usercollection/sleep?start_date=${startDate}&end_date=${date}`,
      accessToken
    )
  ]);

  const days = uniqueDays(
    dailyReadiness.data ?? [],
    dailySleep.data ?? [],
    dailyActivity.data ?? [],
    sleepPeriods.data ?? []
  );

  const latestDay =
    days.find((day) => {
      const readiness = dailyReadiness.data?.find((item) => item.day === day);
      const sleep = dailySleep.data?.find((item) => item.day === day);
      const activity = dailyActivity.data?.find((item) => item.day === day);
      const sleepPeriod = sleepPeriods.data?.find((item) => item.day === day);

      return [
        readiness?.score,
        sleep?.score,
        activity?.score,
        sleepPeriod?.average_hrv,
        sleepPeriod?.lowest_heart_rate,
        sleepPeriod?.average_heart_rate
      ].some((value) => numberOrNull(value) !== null);
    }) ??
    latestByDay(dailyReadiness.data ?? [])?.day ??
    latestByDay(dailySleep.data ?? [])?.day ??
    latestByDay(dailyActivity.data ?? [])?.day ??
    latestByDay(sleepPeriods.data ?? [])?.day ??
    date;

  const readiness = dailyReadiness.data?.find((item) => item.day === latestDay) ?? null;
  const sleep = dailySleep.data?.find((item) => item.day === latestDay) ?? null;
  const activity = dailyActivity.data?.find((item) => item.day === latestDay) ?? null;
  const sleepPeriod = sleepPeriods.data?.find((item) => item.day === latestDay) ?? null;

  const hrvRmssdMs =
    numberOrNull(sleepPeriod?.average_hrv) ?? averageNumericItems(sleepPeriod?.hrv?.items);
  const restingHeartRateBpm =
    numberOrNull(sleepPeriod?.lowest_heart_rate) ??
    numberOrNull(sleepPeriod?.average_heart_rate) ??
    averageNumericItems(sleepPeriod?.heart_rate?.items);

  return [
    {
      provider: "oura",
      date: latestDay,
      readinessScore: numberOrNull(readiness?.score),
      recoveryScore: numberOrNull(readiness?.score),
      sleepScore: numberOrNull(sleep?.score),
      hrvRmssdMs,
      restingHeartRateBpm,
      activityScore: numberOrNull(activity?.score),
      sourcePayload: {
        daily_readiness: readiness,
        daily_sleep: sleep,
        daily_activity: activity,
        sleep: sleepPeriod
      }
    }
  ];
}
