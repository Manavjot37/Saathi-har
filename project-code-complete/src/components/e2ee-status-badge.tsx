import { Lock, ShieldCheck } from "lucide-react";

/**
 * Visual badge indicating end-to-end encryption status on the Secure Chat.
 * Shows a lock icon with a brief label.
 */
export function E2eeStatusBadge({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-routine/12 px-3 py-1">
      <Lock className="h-3 w-3 text-routine" />
      <span className="text-[10px] font-semibold tracking-wide text-routine">
        End-to-end encrypted
      </span>
      <ShieldCheck className="h-3 w-3 text-routine" />
    </div>
  );
}
