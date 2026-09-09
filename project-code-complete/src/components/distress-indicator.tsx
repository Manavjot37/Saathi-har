import { AlertTriangle, Brain, Heart, ShieldAlert } from "lucide-react";
import type { DistressLevel } from "@/lib/nlp-analyzer";

const config: Record<
  DistressLevel,
  { icon: React.ElementType; bg: string; text: string; label: string; ring: string }
> = {
  low: {
    icon: Heart,
    bg: "bg-routine/12",
    text: "text-routine",
    label: "Calm",
    ring: "ring-routine/20",
  },
  moderate: {
    icon: Brain,
    bg: "bg-review/12",
    text: "text-review",
    label: "Moderate",
    ring: "ring-review/20",
  },
  high: {
    icon: AlertTriangle,
    bg: "bg-priority/12",
    text: "text-priority",
    label: "High distress",
    ring: "ring-priority/20",
  },
  crisis: {
    icon: ShieldAlert,
    bg: "bg-urgent/12",
    text: "text-urgent",
    label: "Crisis",
    ring: "ring-urgent/25",
  },
};

/**
 * Inline badge that indicates the AI-detected distress level of a chat message
 * or check-in note. Visible to counsellors; optionally shown to victims.
 */
export function DistressIndicator({
  level,
  score,
  compact = false,
}: {
  level: DistressLevel;
  score: number;
  compact?: boolean;
}) {
  const c = config[level];
  const Icon = c.icon;

  if (level === "low" && compact) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text} ring-1 ${c.ring}`}
      title={`AI distress score: ${score}/100`}
    >
      <Icon className="h-3 w-3" />
      {!compact && <span>{c.label}</span>}
      {level === "crisis" && (
        <span className="ml-0.5 animate-pulse">●</span>
      )}
    </span>
  );
}

/**
 * Larger card variant for the counsellor dashboard showing AI distress
 * analysis details with triggers/reasons.
 */
export function DistressCard({
  level,
  score,
  dominantEmotion,
  triggers,
}: {
  level: DistressLevel;
  score: number;
  dominantEmotion: string;
  triggers: string[];
}) {
  const c = config[level];
  const Icon = c.icon;

  return (
    <div
      className={`rounded-xl border p-3 ${c.bg} ${c.ring} ring-1`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${c.text}`} />
        <span className={`text-sm font-bold ${c.text}`}>
          {c.label} — {score}/100
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground/70">
        Dominant emotion: <span className="font-semibold capitalize">{dominantEmotion}</span>
      </p>
      {triggers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {triggers.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/60"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] italic text-muted-foreground">
        AI-assisted indicator — not a clinical diagnosis.
      </p>
    </div>
  );
}
