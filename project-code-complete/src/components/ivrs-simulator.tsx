import { useState } from "react";
import { Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ivrsScript } from "@/lib/extra-data";
import { saveIvrsLog, type CheckInResult } from "@/lib/saathi-store";
import { VoiceStressAnalyzer } from "@/components/voice-stress-analyzer";
import { voiceToWellnessSignal, computeWellnessScore, saveWellnessResult } from "@/lib/wellness-engine";

export function IvrsSimulator({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [logTier, setLogTier] = useState<string | null>(null);
  const [mode, setMode] = useState<"keypad" | "voice">("keypad");

  const current = ivrsScript[step];

  const press = (value: string) => {
    const nextAnswers = [...answers, value];
    setAnswers(nextAnswers);
    if (step < ivrsScript.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const mood = Number(nextAnswers[0] ?? 2);
    const sleep = (nextAnswers[1] ?? "ok") as CheckInResult["sleep"];
    const safety = (nextAnswers[2] ?? "yes") as CheckInResult["safety"];
    const logs = saveIvrsLog({ mood, sleep, safety });
    setLogTier(logs[0]?.suggestedTier ?? "routine");
    setDone(true);
    toast.success("IVRS check-in saved into the same case feed");
    onComplete?.();
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setDone(false);
    setLogTier(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-brand" />
          <div>
            <p className="font-display text-base font-bold text-foreground">IVRS & AI Voice Check-In</p>
            <p className="text-xs text-muted-foreground">
              Keypad dialer or AI acoustic voice biomarker analysis.
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-semibold">
          <button
            onClick={() => setMode("keypad")}
            className={`px-2.5 py-1 rounded-md transition-all ${mode === "keypad" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
          >
            Keypad
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`px-2.5 py-1 rounded-md transition-all ${mode === "voice" ? "bg-brand text-brand-foreground shadow-xs" : "text-muted-foreground"}`}
          >
            AI Voice
          </button>
        </div>
      </div>

      {mode === "voice" ? (
        <VoiceStressAnalyzer
          onAnalysisComplete={(vRes) => {
            const vSignal = voiceToWellnessSignal(vRes.stressScore);
            const computed = computeWellnessScore([vSignal]);
            saveWellnessResult(computed);
            toast.success(`Voice check-in complete: ${vRes.stressLevel.toUpperCase()} stress detected`);
            onComplete?.();
          }}
        />
      ) : (
        <div className="mx-auto max-w-xs rounded-[1.5rem] border-4 border-[oklch(0.45_0.05_250)] bg-[oklch(0.28_0.04_250)] p-4 text-[oklch(0.95_0.02_245)] shadow-card">
          <div className="mb-3 rounded-lg bg-black/40 px-3 py-4 text-center text-sm">
            {done ? (
              <span className="flex flex-col items-center gap-1">
                <CheckCircle2 className="h-6 w-6 text-routine" />
                Thank you. Your responses were recorded.
                {logTier && <span className="text-xs opacity-80">Suggested tier: {logTier}</span>}
              </span>
            ) : (
              current?.prompt
            )}
          </div>

          {!done && current && (
            <div className="grid grid-cols-3 gap-2">
              {current.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => press(o.value)}
                  className="rounded-full bg-[oklch(0.4_0.05_250)] py-3 text-sm font-bold hover:bg-[oklch(0.48_0.06_250)]"
                >
                  {o.key}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-80">{o.label}</span>
                </button>
              ))}
            </div>
          )}

          {done && (
            <Button className="mt-2 w-full" variant="secondary" onClick={reset}>
              Run again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
