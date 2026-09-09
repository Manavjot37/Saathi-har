import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, HeartHandshake, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { NotificationsCentre } from "@/components/notifications-centre";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { clearSession, readSession } from "@/lib/auth";
import { isRtl, useLanguage } from "@/lib/i18n";
import {
  addCaregiverMark,
  loadCaregiverMarks,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type CaregiverMark,
} from "@/lib/saathi-store";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      { title: "Caregiver space — SAATHI" },
      {
        name: "description",
        content: "Limited caregiver access: confirm safe today and appointments only.",
      },
    ],
  }),
  component: CaregiverPage,
});

function CaregiverPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Caregiver");
  const [safeToday, setSafeToday] = useState(true);
  const [apptOk, setApptOk] = useState(false);
  const [note, setNote] = useState("");
  const [marks, setMarks] = useState<CaregiverMark[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const { lang, t } = useLanguage();

  useEffect(() => {
    const session = readSession();
    if (session?.role === "caregiver") setName(session.name.split(" ")[0] ?? "Caregiver");
    setMarks(loadCaregiverMarks());
    setNotifs(
      loadNotifications().filter((n) => n.forRole === "caregiver" || n.forRole === "all"),
    );
  }, []);

  const submit = () => {
    const list = addCaregiverMark({
      caseId: "STH-221",
      alias: "Kavita (Alias)",
      safeToday,
      appointmentConfirmed: apptOk,
      note: note.trim(),
    });
    setMarks(list);
    setNote("");
    toast.success("Saved — counsellor notified. No case details were shared with you.");
  };

  return (
    <div className="saathi-grain min-h-screen bg-surface" dir={isRtl(lang) ? "rtl" : "ltr"}>
      <header className="border-b border-border bg-sidebar px-5 py-6 text-sidebar-foreground">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-[140px]">
            <p className="font-display text-lg font-bold">SAATHI · {t("caregiver")}</p>
            <p className="text-xs text-sidebar-foreground/65">{t("caregiverHeaderNotice")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            <button
              onClick={() => {
                clearSession();
                navigate({ to: "/" });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-sidebar-accent px-3 py-2 text-xs cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("signOut")}
            </button>
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-2xl">
          <h1 className="font-display text-2xl font-bold">{t("helloCaregiver", { name })}</h1>
          <p className="mt-1 text-sm text-sidebar-foreground/70">
            {t("caregiverDesc")}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <section className="saathi-panel p-5">
          <p className="font-display flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-brand" /> {t("dailySafetyConfirmation")}
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("safeToday")}</p>
                <p className="text-xs text-muted-foreground">{t("safeTodayDesc")}</p>
              </div>
              <Switch checked={safeToday} onCheckedChange={setSafeToday} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1 text-foreground">
                  <CalendarCheck className="h-4 w-4" /> {t("apptConfirmed")}
                </p>
                <p className="text-xs text-muted-foreground">{t("apptConfirmedDesc")}</p>
              </div>
              <Switch checked={apptOk} onCheckedChange={setApptOk} />
            </div>
            <Textarea
              placeholder={t("caregiverNotePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button className="w-full cursor-pointer" onClick={submit}>
              {t("submitCaregiverReport")}
            </Button>
          </div>
        </section>

        <section className="saathi-panel p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">{t("recentMarks")}</p>
          {marks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noMarksYet")}</p>
          ) : (
            <ul className="space-y-2">
              {marks.slice(0, 5).map((m) => (
                <li key={m.id} className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
                  {m.safeToday ? t("safe") : t("needsAttention")} ·{" "}
                  {m.appointmentConfirmed ? t("completed") : t("upcomingStage")} · {m.at}
                  {m.note ? ` — ${m.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="saathi-panel p-5">
          <NotificationsCentre
            items={notifs}
            onRead={(id) => setNotifs(markNotificationRead(id).filter((n) => n.forRole === "caregiver" || n.forRole === "all"))}
            onReadAll={() => setNotifs(markAllNotificationsRead("caregiver").filter((n) => n.forRole === "caregiver" || n.forRole === "all"))}
          />
        </section>
      </main>
    </div>
  );
}
