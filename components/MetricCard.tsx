import { Activity, BedDouble, HeartPulse, ShieldCheck } from "lucide-react";

const icons = {
  recovery: ShieldCheck,
  sleep: BedDouble,
  hrv: HeartPulse,
  activity: Activity
};

export function MetricCard({
  label,
  value,
  trend,
  tone = "neutral",
  icon
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: "good" | "watch" | "rest" | "neutral";
  icon: keyof typeof icons;
}) {
  const Icon = icons[icon];
  const tones = {
    good: "bg-mint text-ink",
    watch: "bg-skywash text-ink",
    rest: "bg-coral/20 text-ink",
    neutral: "bg-white/75 text-ink"
  };

  return (
    <div className="rounded-lg border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-moss">{label}</span>
        <span className={`rounded-full p-2 ${tones[tone]}`}>
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-normal text-ink">{value}</div>
      {trend ? <div className="mt-1 text-sm text-moss">{trend}</div> : null}
    </div>
  );
}
