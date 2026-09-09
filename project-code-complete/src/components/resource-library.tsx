import { BookOpen, Scale, HeartPulse, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Lang } from "@/lib/i18n";
import { resourcesForLang, type LangResource } from "@/lib/extra-data";

const catIcon = {
  exercise: HeartPulse,
  legal: Scale,
  helpline: Phone,
  wellbeing: BookOpen,
};

export function ResourceLibrary({ lang }: { lang: Lang }) {
  const list = resourcesForLang(lang);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-base font-bold text-foreground">Resource library</p>
        <p className="text-xs text-muted-foreground">
          Filtered for your language — exercises, legal aid and helpline cards.
        </p>
      </div>
      <ul className="space-y-2">
        {list.map((r: LangResource) => {
          const Icon = catIcon[r.category];
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.92_0.03_300)] text-[oklch(0.45_0.08_300)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-brand">{r.category}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success(`Opened “${r.title}” (demo)`)}
              >
                Open
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
