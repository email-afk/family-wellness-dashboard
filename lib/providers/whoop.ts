import type { DailyMetricInput } from "@/lib/types";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

async function whoopGet<T>(path: string, accessToken: string) {
  const response = await fetch(`${WHOOP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`WHOOP request failed: ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchWhoopDailyMetrics(accessToken: string, start: string, end: string): Promise<DailyMetricInput[]> {
  const [recoveries, cycles, sleeps] = await Promise.all([
    whoopGet<{
      records: Array<{
        score?: {
          recovery_score?: number;
          resting_heart_rate?: number;
          hrv_rmssd_milli?: number;
        };
      }>;
    }>(`/recovery?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=1`, accessToken),
    whoopGet<{ records: Array<{ score?: { strain?: number } }> }>(
      `/cycle?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=1`,
      accessToken
    ),
    whoopGet<{ records: Array<{ score?: { sleep_performance_percentage?: number } }> }>(
      `/activity/sleep?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=1`,
      accessToken
    )
  ]);

  const recovery = recoveries.records[0]?.score;
  const cycle = cycles.records[0]?.score;
  const sleep = sleeps.records[0]?.score;

  return [
    {
      provider: "whoop",
      date: start.slice(0, 10),
      recoveryScore: recovery?.recovery_score ?? null,
      sleepPerformance: sleep?.sleep_performance_percentage ?? null,
      hrvRmssdMs: recovery?.hrv_rmssd_milli ?? null,
      restingHeartRateBpm: recovery?.resting_heart_rate ?? null,
      strainScore: cycle?.strain ?? null
    }
  ];
}
