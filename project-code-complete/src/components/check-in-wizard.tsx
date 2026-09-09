import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Moon, Shield, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";
import { saveTodayCheckIn, type CheckInResult } from "@/lib/saathi-store";
import { analyzeText } from "@/lib/nlp-analyzer";
import {
  checkInToWellnessSignal,
  nlpToWellnessSignal,
  computeWellnessScore,
  saveWellnessResult,
  type WellnessSignal,
} from "@/lib/wellness-engine";

const moodKeys = ["moodVeryLow", "moodLow", "moodOkay", "moodGood", "moodStrong"] as const;
const moodEmojis = ["😞", "😔", "😐", "🙂", "😊"];

export function CheckInWizard({
  lang,
  initial,
  onComplete,
  onCancel,
}: {
  lang: Lang;
  initial: CheckInResult | null;
  onComplete: (result: CheckInResult) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [sleep, setSleep] = useState<CheckInResult["sleep"] | null>(initial?.sleep ?? null);
  const [safety, setSafety] = useState<CheckInResult["safety"] | null>(initial?.safety ?? null);
  const [note, setNote] = useState(initial?.note ?? "");

  const canNext =
    (step === 0 && mood !== null) ||
    (step === 1 && sleep !== null) ||
    (step === 2 && safety !== null) ||
    step === 3;

  const submit = () => {
    if (mood === null || sleep === null || safety === null) return;
    const result = saveTodayCheckIn({ mood, sleep, safety, note });

    // Compute composite wellness score
    const checkinSignal = checkInToWellnessSignal(mood, sleep, safety);
    const signals: WellnessSignal[] = [checkinSignal];

    if (note.trim()) {
      const nlpRes = analyzeText(note);
      signals.push(nlpToWellnessSignal(nlpRes.score));
    }

    const wellnessRes = computeWellnessScore(signals);
    saveWellnessResult(wellnessRes);

    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smile className="h-4 w-4 text-brand" /> {t(lang, "moodQ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {moodKeys.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => setMood(i)}
                className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-xl border p-3 ${
                  mood === i ? "border-brand bg-brand/8 ring-2 ring-brand/25" : "border-border"
                }`}
              >
                <span className="text-2xl">{moodEmojis[i]}</span>
                <span className="text-xs font-medium">{t(lang, key)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Moon className="h-4 w-4 text-brand" /> {t(lang, "sleepQ")}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["poor", "sleepPoor"],
                ["ok", "sleepOk"],
                ["good", "sleepGood"],
              ] as const
            ).map(([val, key]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSleep(val)}
                className={`rounded-xl border px-3 py-4 text-sm font-semibold ${
                  sleep === val ? "border-brand bg-brand/8 ring-2 ring-brand/25" : "border-border"
                }`}
              >
                {t(lang, key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-brand" /> {t(lang, "safetyQ")}
          </p>
          <div className="mt-3 space-y-2">
            {(
              [
                ["yes", "safetyYes"],
                ["unsure", "safetyUnsure"],
                ["no", "safetyNo"],
              ] as const
            ).map(([val, key]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSafety(val)}
                className={`flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                  safety === val ? "border-brand bg-brand/8 ring-2 ring-brand/25" : "border-border"
                }`}
              >
                {t(lang, key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-sm font-semibold text-foreground">{t(lang, "noteQ")}</p>
          <Textarea
            className="mt-3 min-h-[100px] resize-none"
            value={note}
            onChange={(e) => {
              if (e.target.value.length <= 200) setNote(e.target.value);
            }}
            placeholder={t(lang, "privateNote")}
          />
          <p className="mt-1 text-xs text-muted-foreground">{note.length}/200</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> {t(lang, "back")}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t(lang, "back")}
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" className="ml-auto" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            {t(lang, "next")} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="ml-auto" onClick={submit}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> {t(lang, "submitCheckIn")}
          </Button>
        )}
      </div>
    </div>
  );
}
