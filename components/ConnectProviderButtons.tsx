import { Link2 } from "lucide-react";

export function ConnectProviderButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
        href="/api/oauth/oura/start"
      >
        <Link2 aria-hidden className="h-4 w-4" />
        Connect Oura
      </a>
      <a
        className="inline-flex items-center gap-2 rounded-lg bg-clay px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
        href="/api/oauth/whoop/start"
      >
        <Link2 aria-hidden className="h-4 w-4" />
        Connect WHOOP
      </a>
    </div>
  );
}
