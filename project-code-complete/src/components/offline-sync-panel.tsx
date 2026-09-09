import { CloudOff, CloudUpload, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  isForcedOffline,
  loadOfflineQueue,
  setForcedOffline,
  syncOfflineQueue,
  type OfflineCheckIn,
} from "@/lib/saathi-store";

export function OfflineSyncPanel({
  queue,
  forcedOffline,
  onChange,
}: {
  queue: OfflineCheckIn[];
  forcedOffline: boolean;
  onChange: (q: OfflineCheckIn[], offline: boolean) => void;
}) {
  const pending = queue.filter((q) => !q.synced);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {forcedOffline ? (
          <WifiOff className="h-5 w-5 text-priority" />
        ) : (
          <Wifi className="h-5 w-5 text-routine" />
        )}
        <div>
          <p className="font-display text-base font-bold text-foreground">Offline check-in sync</p>
          <p className="text-xs text-muted-foreground">
            Save check-ins locally when offline; sync when back online.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={forcedOffline ? "default" : "outline"}
          onClick={() => {
            setForcedOffline(true);
            onChange(loadOfflineQueue(), true);
            toast.message("Demo offline mode on");
          }}
        >
          <CloudOff className="mr-1 h-3.5 w-3.5" /> Simulate offline
        </Button>
        <Button
          size="sm"
          variant={!forcedOffline ? "default" : "outline"}
          onClick={() => {
            setForcedOffline(false);
            const synced = syncOfflineQueue();
            onChange(loadOfflineQueue(), false);
            toast.success(
              synced.length ? `Synced ${synced.length} check-in(s)` : "Back online — queue empty",
            );
          }}
        >
          <CloudUpload className="mr-1 h-3.5 w-3.5" /> Go online & sync
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Status: {forcedOffline || isForcedOffline() ? "Offline (demo)" : "Online"} · Pending:{" "}
        {pending.length}
      </p>

      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((q) => (
            <li
              key={q.id}
              className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
            >
              Queued {q.source} · mood {q.mood + 1}/5 · {q.safety} · {q.suggestedTier}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
