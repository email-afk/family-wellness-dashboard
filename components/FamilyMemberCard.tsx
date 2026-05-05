import { summarizeNumber } from "@/lib/normalization";
import type { FamilyMemberSummary } from "@/lib/types";
import { Bell, EyeOff, Watch } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { TrendLine } from "./TrendLine";

function visibleMetric(
  level: "hidden" | "summary" | "exact",
  exact: string,
  summary: string
) {
  if (level === "hidden") return "Hidden";
  if (level === "summary") return summary;
  return exact;
}

export function FamilyMemberCard({ member }: { member: FamilyMemberSummary }) {
  const today = member.today;
  const statusTone =
    today?.status === "Recovered" ? "good" : today?.status === "Needs Rest" ? "rest" : "watch";

  return (
    <article className="rounded-lg border border-white/75 bg-paper/80 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-ink">{member.displayName}</h2>
            {member.privacy.alertsEnabled ? (
              <Bell aria-label="Alerts allowed" className="h-4 w-4 text-clay" />
            ) : (
              <EyeOff aria-label="Alerts disabled" className="h-4 w-4 text-moss" />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {member.providers.map((provider) => (
              <span
                key={provider}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium uppercase tracking-normal text-moss"
              >
                <Watch aria-hidden className="h-3 w-3" />
                {provider}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white">
          {today?.status ?? "Unknown"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="recovery"
          label="Readiness"
          tone={statusTone}
          value={visibleMetric(
            member.privacy.recovery,
            summarizeNumber(today?.recoveryIndex, "%"),
            today?.status ?? "Summary"
          )}
        />
        <MetricCard
          icon="sleep"
          label="Sleep"
          value={visibleMetric(
            member.privacy.sleep,
            summarizeNumber(today?.sleepIndex, "%"),
            today?.sleepIndex && today.sleepIndex < 60 ? "Poor sleep" : "Sleep ok"
          )}
        />
        <MetricCard
          icon="hrv"
          label="HRV"
          value={visibleMetric(
            member.privacy.hrv,
            summarizeNumber(today?.hrvRmssdMs, " ms"),
            today?.hrvRmssdMs ? "Trend visible" : "No trend"
          )}
        />
        <MetricCard
          icon="activity"
          label="Activity"
          value={visibleMetric(
            member.privacy.activity,
            summarizeNumber(today?.activityIndex, "%"),
            today?.activityIndex && today.activityIndex > 70 ? "High day" : "Balanced"
          )}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-medium text-moss">HRV trend</div>
          <TrendLine values={member.trends.hrv} label={`${member.displayName} HRV trend`} />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-moss">Resting heart rate</div>
          <TrendLine
            values={member.trends.restingHeartRate}
            label={`${member.displayName} resting heart rate trend`}
          />
        </div>
      </div>
    </article>
  );
}
