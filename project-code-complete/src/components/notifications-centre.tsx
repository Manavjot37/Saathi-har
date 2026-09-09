import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/saathi-store";

export function NotificationsCentre({
  items,
  onRead,
  onReadAll,
  title = "Reminders & notifications",
}: {
  items: AppNotification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  title?: string;
}) {
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand" />
          <div>
            <p className="font-display text-base font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">
              {unread ? `${unread} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={onReadAll}>
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No notifications yet.</li>
        )}
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onRead(n.id)}
              className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/50 ${
                n.read ? "opacity-70" : ""
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.kind === "crisis"
                    ? "bg-urgent"
                    : n.read
                      ? "bg-muted-foreground/30"
                      : "bg-brand"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {n.kind} · {n.at}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
