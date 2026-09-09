import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Lang } from "@/lib/i18n";
import { peerGroups, peersForLang } from "@/lib/extra-data";

export function PeerSupportFinder({ lang }: { lang: Lang }) {
  const preferred = peersForLang(lang);
  const rest = peerGroups.filter((p) => !preferred.some((x) => x.id === p.id));

  return (
    <div className="space-y-4">
      <div>
        <p className="font-display flex items-center gap-2 text-base font-bold text-foreground">
          <Users className="h-5 w-5 text-brand" /> Peer support groups
        </p>
        <p className="text-xs text-muted-foreground">
          Curated directory only — no open chat. Ask your counsellor to connect you.
        </p>
      </div>

      <GroupList title="Suggested for your language" items={preferred} />
      {rest.length > 0 && <GroupList title="Other cities" items={rest.slice(0, 4)} />}
    </div>
  );
}

function GroupList({
  title,
  items,
}: {
  title: string;
  items: typeof peerGroups;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((g) => (
          <li key={g.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{g.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {g.city} · {g.language}
                </p>
                <p className="mt-1 text-xs text-foreground/80">{g.focus}</p>
                <p className="text-xs text-muted-foreground">
                  {g.meets} · {g.contact}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast.success(`Interest noted for “${g.name}”. Counsellor will follow up.`)
                }
              >
                Ask to join
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
