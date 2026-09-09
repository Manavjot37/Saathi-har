import { useState } from "react";
import { PhoneCall, ShieldAlert, MessageCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { crisisSteps } from "@/lib/extra-data";
import { addNotification } from "@/lib/saathi-store";

export function CrisisPlaybook({
  onChat,
  onSilent,
}: {
  onChat?: () => void;
  onSilent?: () => void;
}) {
  const [done, setDone] = useState<string[]>([]);

  const mark = (id: string) => setDone((d) => (d.includes(id) ? d : [...d, id]));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-urgent/30 bg-urgent-soft p-4">
        <p className="flex items-center gap-2 font-display text-base font-bold text-foreground">
          <ShieldAlert className="h-5 w-5 text-urgent" /> Crisis escalation playbook
        </p>
        <p className="mt-1 text-sm text-foreground/75">
          If a check-in says you feel unsafe, follow these steps. You choose what feels possible.
        </p>
      </div>

      <ol className="space-y-2">
        {crisisSteps.map((step, idx) => {
          const complete = done.includes(step.id);
          return (
            <li
              key={step.id}
              className={`rounded-xl border p-4 ${
                complete ? "border-routine bg-routine-soft/50" : "border-border bg-card"
              }`}
            >
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {step.action === "call" && (
                      <a href={step.href}>
                        <Button
                          size="sm"
                          className="bg-urgent text-white hover:bg-urgent/90"
                          onClick={() => mark(step.id)}
                        >
                          <PhoneCall className="mr-1 h-3.5 w-3.5" /> Call 112
                        </Button>
                      </a>
                    )}
                    {step.action === "silent" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addNotification({
                            title: "Silent crisis alert",
                            body: "Victim triggered silent alert from crisis playbook.",
                            kind: "crisis",
                            forRole: "counsellor",
                          });
                          onSilent?.();
                          mark(step.id);
                          toast.success("Silent alert sent to counsellor");
                        }}
                      >
                        <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Silent alert
                      </Button>
                    )}
                    {step.action === "plan" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          mark(step.id);
                          toast.info("Safety plan sheet opens with your counsellor (demo)");
                        }}
                      >
                        <BookOpen className="mr-1 h-3.5 w-3.5" /> Safety plan
                      </Button>
                    )}
                    {step.action === "chat" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          mark(step.id);
                          onChat?.();
                        }}
                      >
                        <MessageCircle className="mr-1 h-3.5 w-3.5" /> Open chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
