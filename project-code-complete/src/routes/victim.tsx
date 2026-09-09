import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  EyeOff,
  Flame,
  HeartHandshake,
  LogOut,
  MessageCircle,
  PhoneCall,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { AppointmentBooking } from "@/components/appointment-booking";
import { CaseStatusTracker } from "@/components/case-status-tracker";
import { CheckInWizard } from "@/components/check-in-wizard";
import { CrisisPlaybook } from "@/components/crisis-playbook";
import { IvrsSimulator } from "@/components/ivrs-simulator";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationsCentre } from "@/components/notifications-centre";
import { OfflineSyncPanel } from "@/components/offline-sync-panel";
import { PeerSupportFinder } from "@/components/peer-support-finder";
import { ResourceLibrary } from "@/components/resource-library";
import { SecureChat } from "@/components/secure-chat";
import { WellnessScoreCard } from "@/components/wellness-score-card";
import { VoiceStressAnalyzer } from "@/components/voice-stress-analyzer";
import {
  getLatestWellness,
  voiceToWellnessSignal,
  computeWellnessScore,
  saveWellnessResult,
  type WellnessResult,
} from "@/lib/wellness-engine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearSession, readSession } from "@/lib/auth";
import { isRtl, useLanguage, type Lang } from "@/lib/i18n";
import { exercises, helplines, moodHistory, upcoming } from "@/lib/mock-data";
import {
  isForcedOffline,
  loadAppointments,
  loadNotifications,
  loadOfflineQueue,
  loadTodayCheckIn,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type CheckInResult,
  type OfflineCheckIn,
} from "@/lib/saathi-store";

export const Route = createFileRoute("/victim")({
  head: () => ({
    meta: [
      { title: "My Support Space — SAATHI Victim Dashboard" },
      {
        name: "description",
        content:
          "Daily check-in, calming exercises, upcoming counsellor calls and one-tap emergency helplines in your language.",
      },
      { property: "og:title", content: "My Support Space — SAATHI" },
      {
        property: "og:description",
        content: "Check in, practise calming exercises and reach help in one tap.",
      },
    ],
  }),
  component: VictimDashboard,
});

function VictimDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Friend");
  const { lang, t } = useLanguage();
  const [done, setDone] = useState<string[]>(exercises.filter((e) => e.done).map((e) => e.title));
  const [showHelp, setShowHelp] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checkIn, setCheckIn] = useState<CheckInResult | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [bookedCount, setBookedCount] = useState(0);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineCheckIn[]>([]);
  const [forcedOffline, setForcedOfflineState] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [wellness, setWellness] = useState<WellnessResult | null>(null);

  const [panicOpen, setPanicOpen] = useState(false);
  const [silentAlertSent, setSilentAlertSent] = useState(false);
  const panicTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session?.role === "victim") setName(session.name.split(" ")[0] ?? "Friend");
    const ci = loadTodayCheckIn();
    setCheckIn(ci);
    setWellness(getLatestWellness());
    if (ci?.safety === "no") setCrisisOpen(true);
    setBookedCount(loadAppointments().filter((a) => a.status === "booked").length);
    setNotifs(loadNotifications().filter((n) => n.forRole === "victim" || n.forRole === "all"));
    setOfflineQueue(loadOfflineQueue());
    setForcedOfflineState(isForcedOffline());

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const lastDate = localStorage.getItem("saathi_lastCheckIn");
    const saved = parseInt(localStorage.getItem("saathi_streak") ?? "0", 10);
    if (lastDate === today) {
      setStreak(saved);
    } else if (lastDate === yesterday) {
      setStreak(saved);
    } else {
      setStreak(0);
      localStorage.setItem("saathi_streak", "0");
    }
  }, []);

  const toggle = (title: string) =>
    setDone((d) => (d.includes(title) ? d.filter((t) => t !== title) : [...d, title]));

  const signOut = () => {
    clearSession();
    navigate({ to: "/" });
  };

  const recordCheckInStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const lastDate = localStorage.getItem("saathi_lastCheckIn");
    if (lastDate === today) return;
    const prev = parseInt(localStorage.getItem("saathi_streak") ?? "0", 10);
    const newStreak = lastDate === yesterday ? prev + 1 : 1;
    localStorage.setItem("saathi_streak", String(newStreak));
    localStorage.setItem("saathi_lastCheckIn", today);
    setStreak(newStreak);
  };

  const startPanicHold = () => {
    panicTimer.current = setTimeout(() => {
      setSilentAlertSent(true);
      setPanicOpen(true);
    }, 3000);
  };
  const cancelPanicHold = () => {
    if (panicTimer.current) clearTimeout(panicTimer.current);
  };

  const avgMood = moodHistory.reduce((s, d) => s + d.score, 0) / moodHistory.length;
  const sessionsAhead = upcoming.length + bookedCount;

  return (
    <div className="min-h-screen bg-surface pb-24" dir={isRtl(lang) ? "rtl" : "ltr"}>
      <header className="bg-sidebar px-5 pb-10 pt-6 text-sidebar-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold leading-none">SAATHI</p>
            <p className="text-xs text-sidebar-foreground/60">{t(lang, "appTagline")}</p>
          </div>
          <LanguageToggle compact />
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-[oklch(0.9_0.04_155)] px-3 py-1 text-xs font-bold text-brand">
              <Flame className="h-3.5 w-3.5 text-[oklch(0.62_0.1_55)]" />
              {t(lang, "streakDays", { n: streak })}
            </span>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg bg-sidebar-accent px-3 py-2 text-xs font-medium cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> {t(lang, "signOut")}
          </button>
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <h1 className="font-display text-2xl font-bold">{t(lang, "greeting", { name })}</h1>
          <p className="mt-1 text-sm text-sidebar-foreground/70">{t(lang, "greetingSub")}</p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-5 px-4">
        <section className="rounded-2xl border border-urgent/30 bg-urgent-soft p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-urgent text-white">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display text-base font-bold text-foreground">{t(lang, "needHelp")}</p>
              <p className="mt-0.5 text-sm text-foreground/70">{t(lang, "needHelpSub")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowHelp((v) => !v)}
                  className="h-11 bg-urgent font-semibold text-white hover:bg-urgent/90 cursor-pointer"
                >
                  <PhoneCall className="mr-1 h-4 w-4" /> {t(lang, "emergencyHelplines")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 font-semibold cursor-pointer"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle className="mr-1 h-4 w-4" /> {t(lang, "messageCounsellor")}
                </Button>
              </div>
              {showHelp && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {helplines.map((h) => (
                    <li
                      key={h.number}
                      className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm"
                    >
                      <span className="text-foreground">{t(lang, h.name)}</span>
                      <a href={`tel:${h.number}`} className="font-bold text-urgent">
                        {h.number}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* 1 — Guided check-in */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground">{t(lang, "checkInTitle")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t(lang, "checkInSub")}</p>
          {checkIn ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-routine-soft px-3 py-3 text-sm text-foreground">
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-routine" /> {t(lang, "checkInDone")}
                </p>
                <p className="mt-1 text-muted-foreground">{t(lang, "thankYou")}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Mood {checkIn.mood + 1}/5 · Sleep {checkIn.sleep} · Safety {checkIn.safety} · Flag{" "}
                  <span className="font-semibold capitalize text-foreground">{checkIn.suggestedTier}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
                {t(lang, "continueCheckIn")}
              </Button>
            </div>
          ) : (
            <Button className="mt-4 h-11 font-semibold" onClick={() => setWizardOpen(true)}>
              {t(lang, "startCheckIn")}
            </Button>
          )}
        </section>

        {/* AI Multimodal Wellness & Voice Stress Section */}
        <section className="space-y-4">
          <WellnessScoreCard result={wellness} />
          <VoiceStressAnalyzer
            onAnalysisComplete={(vRes) => {
              const vSignal = voiceToWellnessSignal(vRes.stressScore);
              const computed = computeWellnessScore([vSignal]);
              saveWellnessResult(computed);
              setWellness(computed);
              toast.success("Voice biomarkers analyzed locally!");
            }}
          />
        </section>

        {/* 4 — Case status */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <CaseStatusTracker lang={lang} />
        </section>

        {/* 3 — Appointment booking */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <AppointmentBooking
            lang={lang}
            createdBy="victim"
            onBooked={(list) => setBookedCount(list.filter((a) => a.status === "booked").length)}
          />
        </section>

        {/* 6 — Notifications */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <NotificationsCentre
            items={notifs}
            onRead={(id) =>
              setNotifs(
                markNotificationRead(id).filter((n) => n.forRole === "victim" || n.forRole === "all"),
              )
            }
            onReadAll={() =>
              setNotifs(
                markAllNotificationsRead("victim").filter(
                  (n) => n.forRole === "victim" || n.forRole === "all",
                ),
              )
            }
          />
        </section>

        {/* 10 — Crisis playbook entry */}
        {(checkIn?.safety === "no" || checkIn?.safety === "unsure") && (
          <section className="rounded-2xl border border-urgent/30 bg-urgent-soft p-5 shadow-card">
            <p className="font-display text-base font-bold text-foreground">Crisis playbook ready</p>
            <p className="mt-1 text-sm text-foreground/75">
              Your last check-in flagged safety concern. Open the step-by-step playbook anytime.
            </p>
            <Button className="mt-3 bg-urgent text-white hover:bg-urgent/90" onClick={() => setCrisisOpen(true)}>
              Open crisis playbook
            </Button>
          </section>
        )}

        {/* 7 — Resources by language */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <ResourceLibrary lang={lang} />
        </section>

        {/* 13 — Peer support */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <PeerSupportFinder lang={lang} />
        </section>

        {/* 11 — IVRS simulator */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <IvrsSimulator
            onComplete={() => {
              setCheckIn(loadTodayCheckIn());
              setOfflineQueue(loadOfflineQueue());
            }}
          />
        </section>

        {/* 12 — Offline sync */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <OfflineSyncPanel
            queue={offlineQueue}
            forcedOffline={forcedOffline}
            onChange={(q, offline) => {
              setOfflineQueue(q);
              setForcedOfflineState(offline);
              setCheckIn(loadTodayCheckIn());
            }}
          />
        </section>

        {/* Exercises */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">{t(lang, "exercises")}</h2>
            <span className="text-sm font-semibold text-brand">
              {done.length}/{exercises.length} {t(lang, "done")}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${(done.length / exercises.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {exercises.map((e) => {
              const complete = done.includes(e.title);
              return (
                <li
                  key={e.title}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <button onClick={() => toggle(e.title)} aria-label={`Mark ${e.title}`}>
                    {complete ? (
                      <CheckCircle2 className="h-6 w-6 text-routine" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${complete ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {t(lang, e.title)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(lang, e.detail)}</p>
                  </div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Play className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground">{t(lang, "myWeek")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t(lang, "weekSub")}</p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodHistory} margin={{ left: -22, right: 4, top: 8 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="score" fill="var(--brand)" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display flex items-center gap-2 text-base font-bold text-foreground">
            <TrendingUp className="h-5 w-5 text-brand" /> {t(lang, "weeklyProgress")}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-xl bg-muted/50 px-3 py-4 text-center">
              <span className="font-display text-2xl font-bold text-brand">{avgMood.toFixed(1)}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t(lang, "avgMood")}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-muted/50 px-3 py-4 text-center">
              <span className="font-display text-2xl font-bold text-routine">
                {done.length}/{exercises.length}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{t(lang, "exercisesDone")}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-muted/50 px-3 py-4 text-center">
              <span className="font-display text-2xl font-bold text-foreground">{sessionsAhead}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t(lang, "sessionsAhead")}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground">{t(lang, "upcoming")}</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((u) => (
              <li key={u.title} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(lang, u.title)}</p>
                  <p className="text-xs text-muted-foreground">{u.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.9_0.04_300)] text-[oklch(0.45_0.08_300)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-foreground">{t(lang, "rights")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(lang, "rightsBody")}</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2">
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 rounded-xl bg-urgent py-3 text-sm font-bold text-white"
          >
            <PhoneCall className="h-4 w-4" /> {t(lang, "call112")}
          </a>
          <button
            onMouseDown={startPanicHold}
            onMouseUp={cancelPanicHold}
            onMouseLeave={cancelPanicHold}
            onTouchStart={startPanicHold}
            onTouchEnd={cancelPanicHold}
            onClick={() => setPanicOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <EyeOff className="h-3.5 w-3.5" /> {t(lang, "quietHelp")}
          </button>
        </div>
      </div>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t(lang, "checkInTitle")}</DialogTitle>
            <DialogDescription>{t(lang, "checkInSub")}</DialogDescription>
          </DialogHeader>
          <CheckInWizard
            lang={lang}
            initial={checkIn}
            onCancel={() => setWizardOpen(false)}
            onComplete={(result) => {
              setCheckIn(result);
              recordCheckInStreak();
              setWizardOpen(false);
              setOfflineQueue(loadOfflineQueue());
              if (result.safety === "no") setCrisisOpen(true);
              toast.success(
                forcedOffline || isForcedOffline()
                  ? "Saved offline — will sync when online"
                  : t(lang, "thankYou"),
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={crisisOpen} onOpenChange={setCrisisOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crisis support</DialogTitle>
            <DialogDescription>Follow these steps at your own pace.</DialogDescription>
          </DialogHeader>
          <CrisisPlaybook
            onChat={() => {
              setCrisisOpen(false);
              setChatOpen(true);
            }}
            onSilent={() => setSilentAlertSent(true)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t(lang, "chatTitle")}</DialogTitle>
            <DialogDescription>{t(lang, "chatSub")}</DialogDescription>
          </DialogHeader>
          <SecureChat
            role="victim"
            title={t(lang, "chatTitle")}
            subtitle={t(lang, "chatSub")}
            placeholder={t(lang, "typeMessage")}
            sendLabel={t(lang, "send")}
            requestCallLabel={t(lang, "requestCall")}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={panicOpen}
        onOpenChange={(o) => {
          setPanicOpen(o);
          if (!o) setSilentAlertSent(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-urgent">
              <ShieldAlert className="h-5 w-5" /> {t(lang, "quietHelp")}
            </DialogTitle>
            <DialogDescription>
              {t(lang, "needHelpSub")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {silentAlertSent ? (
              <div className="rounded-xl bg-routine-soft p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-routine" />
                <p className="mt-2 font-semibold text-foreground">{t(lang, "silentAlertSent")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(lang, "silentAlertNotice")}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setSilentAlertSent(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(lang, "messageCounsellor")}</p>
                  <p className="text-xs text-muted-foreground">{t(lang, "silentAlertNotice")}</p>
                </div>
              </button>
            )}
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 rounded-xl bg-urgent py-3 text-sm font-bold text-white"
            >
              <PhoneCall className="h-4 w-4" /> {t(lang, "call112")}
            </a>
            <a
              href="tel:181"
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <PhoneCall className="h-4 w-4" /> {t(lang, "helplineWomen")} 181
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
