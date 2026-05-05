  
 export type Provider = "oura" | "whoop";

export type DailyMetricInput = {
  provider: Provider;
  date: string;

  recoveryIndex?: number | null;
  sleepIndex?: number | null;
  activityIndex?: number | null;
  hrvRmssdMs?: number | null;
  restingHeartRateBpm?: number | null;
  
  
  recoveryScore?: number | null;
  readinessScore?: number | null;
  sleepScore?: number | null;
  sleepPerformance?: number | null;

  strainScore?: number | null;
activityScore?: number | null;
sourcePayload?: unknown;
status?: string | null;
};


export type NormalizedDailyMetric = {
  date: string;
  
  recoveryIndex: number | null;
  sleepIndex: number | null;
  activityIndex: number | null;
  hrvRmssdMs: number | null;
  restingHeartRateBpm: number | null;
  
  recoveryScore: number | null;
readinessScore: number | null;
sleepScore: number | null;
sleepPerformance: number | null;

strainScore: number | null;
activityScore: number | null;
status: string | null;
sourcePayload: unknown;
  
  
};