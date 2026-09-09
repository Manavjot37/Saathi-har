import { useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";
import {
  bookAppointment,
  loadAppointments,
  openSlots,
  type Appointment,
  type Slot,
} from "@/lib/saathi-store";

export function AppointmentBooking({
  lang,
  createdBy = "victim",
  onBooked,
}: {
  lang: Lang;
  createdBy?: "victim" | "counsellor";
  onBooked?: (list: Appointment[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [appts, setAppts] = useState<Appointment[]>(() =>
    typeof window === "undefined" ? [] : loadAppointments().filter((a) => a.status === "booked"),
  );
  const slots = useMemo(() => openSlots(), [appts]);

  const confirm = () => {
    const slot = slots.find((s) => s.id === selected);
    if (!slot) return;
    const list = bookAppointment(slot, createdBy);
    setAppts(list.filter((a) => a.status === "booked"));
    setSelected(null);
    onBooked?.(list);
    toast.success(`${t(lang, "booked")}: ${slot.when}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-5 w-5 text-brand" />
        <div>
          <p className="font-display text-base font-bold text-foreground">{t(lang, "bookSession")}</p>
          <p className="text-xs text-muted-foreground">{t(lang, "bookSub")}</p>
        </div>
      </div>

      {appts.length > 0 && (
        <ul className="space-y-2">
          {appts.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-xl bg-routine-soft px-3 py-2 text-sm text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-routine" />
              <span className="flex-1 font-medium">{a.when}</span>
              <span className="text-xs font-semibold text-routine">{t(lang, "booked")}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t(lang, "slotsAvailable")}
      </p>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(lang, "noSlots")}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((s: Slot) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${
                selected === s.id
                  ? "border-brand bg-brand/8 ring-2 ring-brand/25"
                  : "border-border hover:border-brand/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <Button className="w-full" disabled={!selected} onClick={confirm}>
        {t(lang, "bookConfirm")}
      </Button>
    </div>
  );
}
