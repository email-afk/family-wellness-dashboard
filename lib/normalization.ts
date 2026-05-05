import type { DailyMetricInput, NormalizedDailyMetric } from "@/lib/types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: Array<number | null | undefined>) {
  const present = values.filter((value): value is number => typeof value === "number");
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

export function normalizeDailyMetric(input: DailyMetricInput): NormalizedDailyMetric {
  const recoveryIndex = average([input.recoveryScore, input.readinessScore]);
  const sleepIndex = average([input.sleepScore, input.sleepPerformance]);

  let activityIndex: number | null = null;
  if (typeof input.strainScore === "number") {
    activityIndex = clamp((input.strainScore / 21) * 100);
  } else if (typeof input.activityScore === "number") {
    activityIndex = clamp(input.activityScore);
  }

  const status = getStatusLabel(recoveryIndex, sleepIndex);

  return {
    ...input,
    recoveryIndex: recoveryIndex === null ? null : Math.round(clamp(recoveryIndex)),
    sleepIndex: sleepIndex === null ? null : Math.round(clamp(sleepIndex)),
    activityIndex: activityIndex === null ? null : Math.round(activityIndex),
    status
  };
}

export function getStatusLabel(
  recoveryIndex: number | null,
  sleepIndex: number | null
): NormalizedDailyMetric["status"] {
  if (recoveryIndex === null && sleepIndex === null) return "Unknown";
  const readiness = average([recoveryIndex, sleepIndex]);
  if (readiness === null) return "Unknown";
  if (readiness >= 75) return "Recovered";
  if (readiness >= 55) return "Normal";
  return "Needs Rest";
}

export function summarizeNumber(value: number | null | undefined, unit = "") {
  if (typeof value !== "number") return "No data";
  return `${Math.round(value)}${unit}`;
}
