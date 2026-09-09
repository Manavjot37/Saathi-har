import { CheckCircle2, Circle, MapPin } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { victimCaseStages } from "@/lib/saathi-store";

export function CaseStatusTracker({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-brand" />
        <div>
          <p className="font-display text-base font-bold text-foreground">{t(lang, "caseStatus")}</p>
          <p className="text-xs text-muted-foreground">{t(lang, "caseStatusSub")}</p>
        </div>
      </div>

      <ol className="space-y-0">
        {victimCaseStages.map((stage, idx) => {
          const isCurrent = Boolean(stage.current);
          const isDone = stage.done && !isCurrent;
          return (
            <li key={stage.id} className="relative flex gap-3 pb-5 last:pb-0">
              {idx < victimCaseStages.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 ${
                    isDone || isCurrent ? "bg-brand/40" : "bg-border"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isCurrent
                    ? "bg-brand text-brand-foreground ring-4 ring-brand/20"
                    : isDone
                      ? "bg-routine text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone || isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent ? "text-foreground" : isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t(lang, stage.title)}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                      {t(lang, "currentStage")}
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-semibold uppercase text-routine">
                      {t(lang, "completed")}
                    </span>
                  )}
                  {!isDone && !isCurrent && (
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {t(lang, "upcomingStage")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t(lang, stage.detail)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
