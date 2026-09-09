import { Heart, TrendingUp, TrendingDown, Minus, ShieldAlert, Sparkles, Brain, Mic, CalendarCheck } from "lucide-react";
import { getWellnessColor, getWellnessLabel, type WellnessResult } from "@/lib/wellness-engine";

export function WellnessScoreCard({
  result,
  compact = false,
}: {
  result: WellnessResult | null;
  compact?: boolean;
}) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-brand" />
          <h3 className="font-display text-base font-bold text-foreground">AI Multimodal Wellness Index</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Complete a check-in or voice test to generate your AI wellness index score.</p>
      </div>
    );
  }

  const color = getWellnessColor(result.overallScore);
  const label = getWellnessLabel(result.overallScore);

  const getTrendIcon = () => {
    if (result.trend === "improving") return <TrendingUp className="h-4 w-4 text-routine" />;
    if (result.trend === "declining") return <TrendingDown className="h-4 w-4 text-urgent" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm shadow-sm"
            style={{ backgroundColor: color }}
          >
            {result.overallScore}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground">{label}</span>
              {getTrendIcon()}
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {result.signals.length} passive signal(s) combined
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">AI Wellness & Stress Index</h3>
            <p className="text-xs text-muted-foreground">Multimodal signal fusion engine</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold">
          {getTrendIcon()}
          <span className="capitalize">{result.trend} trend</span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-muted/30 p-4 border border-border/50">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white font-display text-2xl font-bold shadow-md"
          style={{ backgroundColor: color }}
        >
          {result.overallScore}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground font-mono">Score: {result.overallScore}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${result.overallScore}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{result.insight}</p>
        </div>
      </div>

      {result.autoEscalate && (
        <div className="flex items-start gap-2 rounded-xl bg-urgent/10 border border-urgent/30 p-3 text-xs text-urgent">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Automated Clinical Escalation Nudge:</span> Elevated distress detected across inputs. Tier upgraded automatically for counsellor triage.
          </div>
        </div>
      )}

      {result.signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signals Analyzed</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {result.signals.map((s, idx) => {
              let Icon = CalendarCheck;
              if (s.source === "nlp") Icon = Brain;
              if (s.source === "voice") Icon = Mic;

              return (
                <div key={idx} className="flex items-center gap-2 rounded-lg bg-background p-2 border border-border/60">
                  <Icon className="h-4 w-4 text-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground capitalize truncate">{s.source} signal</p>
                    <p className="text-[10px] text-muted-foreground">Score: {s.score}/100</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
