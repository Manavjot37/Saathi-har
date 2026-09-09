import { AlertTriangle, Flag, Search, ShieldCheck } from "lucide-react";
import type { Tier } from "@/lib/mock-data";
import { tierLabel } from "@/lib/mock-data";

export const tierStyles: Record<Tier, { dot: string; text: string; soft: string; stroke: string }> = {
  urgent: { dot: "bg-urgent", text: "text-urgent", soft: "bg-urgent-soft", stroke: "var(--urgent)" },
  priority: {
    dot: "bg-priority",
    text: "text-priority",
    soft: "bg-priority-soft",
    stroke: "var(--priority)",
  },
  review: { dot: "bg-review", text: "text-review", soft: "bg-review-soft", stroke: "var(--review)" },
  routine: {
    dot: "bg-routine",
    text: "text-routine",
    soft: "bg-routine-soft",
    stroke: "var(--routine)",
  },
};

export const tierIcon: Record<Tier, React.ElementType> = {
  urgent: AlertTriangle,
  priority: Flag,
  review: Search,
  routine: ShieldCheck,
};

export function TierBadge({ tier }: { tier: Tier }) {
  const s = tierStyles[tier];
  return (
    <span className={`saathi-stamp ${s.text} ${s.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-[1px] ${s.dot}`} />
      {tierLabel[tier]}
    </span>
  );
}
