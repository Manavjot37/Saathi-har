import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronRight,
  Users,
  Flag,
  Folder,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Settings,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ListOrdered,
  ShieldAlert,
  Sparkles,
  StickyNote,
  UserRoundCog,
  Plus,
  PanelRight,
  SlidersHorizontal,
  X,
  Brain,
} from "lucide-react";

import { XAIExplanationModal } from "@/components/xai-explanation-modal";

import { SecureChat } from "@/components/secure-chat";
import { WellnessScoreCard } from "@/components/wellness-score-card";
import { getLatestWellness } from "@/lib/wellness-engine";
import { NotificationsCentre } from "@/components/notifications-centre";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TierBadge, tierIcon, tierStyles } from "@/components/tier-badge";
import { clearSession, readSession } from "@/lib/auth";
import { moodHistory14 } from "@/lib/extra-data";
import {
  alerts,
  calendarEvents,
  caseProfiles,
  cases,
  helplines,
  resources,
  tierCounts,
  tierLabel,
  totalCases,
  trendSeries,
  whyFlagged,
  type Tier,
} from "@/lib/mock-data";
import {
  addHandoff,
  buildTriageQueue,
  counsellors,
  getCaseCounsellor,
  loadAppointments,
  loadCaregiverMarks,
  loadHandoffs,
  loadIvrsLogs,
  loadNotifications,
  loadTodayCheckIn,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type Appointment,
  type CaregiverMark,
  type HandoffRecord,
  type IvrsLog,
} from "@/lib/saathi-store";
import { LanguageToggle } from "@/components/language-toggle";
import { isRtl, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/counsellor")({
  head: () => ({
    meta: [
      { title: "Counsellor Dashboard — SAATHI Case Management" },
      {
        name: "description",
        content:
          "Triage victim cases by risk tier, review well-being trends, act on alerts and start human assessments.",
      },
      { property: "og:title", content: "Counsellor Dashboard — SAATHI" },
      {
        property: "og:description",
        content: "Triage victim cases by risk tier, review trends and act on alerts.",
      },
    ],
  }),
  component: CounsellorDashboard,
});

type NavKey =
  | "Dashboard"
  | "Today's Work"
  | "Assigned Cases"
  | "Priority Cases"
  | "All Cases"
  | "Messages"
  | "Notifications"
  | "Wellbeing"
  | "Calendar"
  | "Alerts"
  | "Reports"
  | "Resources"
  | "Settings"
  | "Support";

const nav: { label: NavKey; icon: typeof Users; badge?: number }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Today's Work", icon: ListOrdered },
  { label: "Assigned Cases", icon: Users },
  { label: "Priority Cases", icon: Flag },
  { label: "All Cases", icon: Folder },
  { label: "Messages", icon: MessageCircle },
  { label: "Notifications", icon: Bell },
  { label: "Wellbeing", icon: BarChart3 },
  { label: "Calendar", icon: Calendar },
  { label: "Alerts", icon: Bell, badge: 6 },
  { label: "Reports", icon: BarChart3 },
  { label: "Resources", icon: BookOpen },
  { label: "Settings", icon: Settings },
  { label: "Support", icon: LifeBuoy },
];

function CounsellorDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Counsellor");
  const { lang, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<NavKey>("Dashboard");
  const [openTabs, setOpenTabs] = useState<NavKey[]>(["Dashboard"]);
  const [filter, setFilter] = useState<"all" | Tier>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("STH-221");
  const [bellOpen, setBellOpen] = useState(false);
  const [handled, setHandled] = useState<string[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [prefs, setPrefs] = useState({ urgentPush: true, dailyDigest: true, aliasOnly: true });
  const [counsellorNotes, setCounsellorNotes] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteSaved, setNoteSaved] = useState<Record<string, boolean>>({});
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffTo, setHandoffTo] = useState(counsellors[1]!);
  const [handoffReason, setHandoffReason] = useState("");
  const [handoffs, setHandoffs] = useState<HandoffRecord[]>([]);
  const [bookedAppts, setBookedAppts] = useState<Appointment[]>([]);
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({});
  const [todayCheckIn, setTodayCheckIn] = useState(loadTodayCheckIn());
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [careMarks, setCareMarks] = useState<CaregiverMark[]>([]);
  const [ivrsLogs, setIvrsLogs] = useState<IvrsLog[]>([]);
  const [poaFilter, setPoaFilter] = useState<string>("all");
  const [xaiModalOpen, setXaiModalOpen] = useState(false);
  const [xaiTargetCase, setXaiTargetCase] = useState<{ name: string; score: number; tier: Tier; category?: string } | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session?.role === "counsellor") setName(session.name);
    setHandoffs(loadHandoffs());
    setBookedAppts(loadAppointments().filter((a) => a.status === "booked"));
    setTodayCheckIn(loadTodayCheckIn());
    setNotifs(
      loadNotifications().filter((n) => n.forRole === "counsellor" || n.forRole === "all"),
    );
    setCareMarks(loadCaregiverMarks());
    setIvrsLogs(loadIvrsLogs());
    const map: Record<string, string> = {};
    for (const c of cases) {
      map[c.id] = getCaseCounsellor(c.id, caseProfiles[c.id]?.counsellor ?? "Asha Deshmukh");
    }
    setAssignedMap(map);
  }, []);

  const rows = useMemo(
    () =>
      cases.filter((c) => {
        const matchesTier = filter === "all" || c.tier === filter;
        const matchesQuery = (c.id + c.alias + c.note).toLowerCase().includes(query.toLowerCase());
        const noteLower = c.note.toLowerCase();
        let matchesPoa = true;
        if (poaFilter === "rape") matchesPoa = noteLower.includes("rape") || noteLower.includes("trauma");
        else if (poaFilter === "murder_arson") matchesPoa = noteLower.includes("murder") || noteLower.includes("arson") || noteLower.includes("hurt");
        else if (poaFilter === "witness_threat") matchesPoa = noteLower.includes("witness") || noteLower.includes("safety") || noteLower.includes("threat");
        else if (poaFilter === "caste_violence") matchesPoa = noteLower.includes("sc/st") || noteLower.includes("caste") || noteLower.includes("ostracism");

        return matchesTier && matchesQuery && matchesPoa;
      }),
    [filter, poaFilter, query],
  );

  const triage = useMemo(() => buildTriageQueue(cases), [todayCheckIn, handoffs]);

  const selected = cases.find((c) => c.id === selectedId) ?? cases[0]!;
  const donut = tierCounts.map((t) => ({ name: tierLabel[t.tier], value: t.count, tier: t.tier }));
  const selectedCounsellor = assignedMap[selected.id] ?? "Asha Deshmukh";

  const openCase = (id: string) => {
    setSelectedId(id);
    setView("Dashboard");
    setSidebarOpen(false);
    setBellOpen(false);
  };

  const goto = (key: NavKey) => {
    setView(key);
    setOpenTabs((tabs) => (tabs.includes(key) ? tabs : [...tabs, key]));
    setSidebarOpen(false);
    setBellOpen(false);
    if (key === "Priority Cases") setFilter("urgent");
    if (key === "All Cases" || key === "Assigned Cases") setFilter("all");
  };

  const closeTab = (key: NavKey) => {
    if (key === "Dashboard") return;
    setOpenTabs((tabs) => tabs.filter((t) => t !== key));
    if (view === key) {
      const remaining = openTabs.filter((t) => t !== key);
      setView(remaining[remaining.length - 1] ?? "Dashboard");
    }
  };

  const signOut = () => {
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-surface" dir={isRtl(lang) ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none">SAATHI</p>
            <p className="mt-1 text-[10px] leading-tight text-sidebar-foreground/60">
              {t("appSubtitle")}
            </p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => goto(item.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                view === item.label
                  ? "bg-brand font-semibold text-brand-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{t(item.label)}</span>
              {item.badge ? (
                <span className="rounded-full bg-urgent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <a
          href="tel:112"
          className="m-4 block rounded-xl bg-sidebar-accent p-4 transition-opacity hover:opacity-90"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-urgent text-white">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t("emergencyHelpline")}</p>
              <p className="text-xs text-sidebar-foreground/70">24x7 Support · 112</p>
            </div>
          </div>
        </a>

        <button
          onClick={signOut}
          className="mx-4 mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> {t("signOut")}
        </button>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
          <button className="lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-lg font-bold text-foreground sm:text-xl">
              {t("counsellorWelcome", { name: name.split(" ")[0] ?? "Asha" })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {view === "Dashboard" ? t("counsellorSubtext") : t(view)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle compact />
          </div>

          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => setBellOpen((o) => !o)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {6 - handled.length > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-urgent text-[10px] font-bold text-white animate-pulse">
                  {6 - handled.length}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-11 z-30 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <button onClick={() => setBellOpen(false)} aria-label="Close notifications">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {alerts.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => openCase(a.id)}
                        className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted"
                      >
                        <p className="text-sm text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => goto("Alerts")}
                  className="mt-1 w-full rounded-lg bg-muted px-2 py-2 text-xs font-semibold text-brand"
                >
                  View all alerts
                </button>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              {name.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">Counsellor</p>
            </div>
          </div>
        </header>

        {/* Feature 7 — Dynamic section tabs */}
        <div className="border-b border-border bg-card px-3 pt-2">
          <div className="flex items-end gap-1 overflow-x-auto">
            {openTabs.map((key) => {
              const item = nav.find((n) => n.label === key);
              const active = view === key;
              return (
                <div
                  key={key}
                  className={`group flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-border bg-background font-semibold text-brand"
                      : "border-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <button
                    onClick={() => setView(key)}
                    className="flex items-center gap-2"
                  >
                    {item && <item.icon className="h-4 w-4" />}
                    <span className="whitespace-nowrap">{key}</span>
                  </button>
                  {key !== "Dashboard" && (
                    <button
                      onClick={() => closeTab(key)}
                      aria-label={`Close ${key}`}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {openTabs.length < nav.length && (
              <button
                onClick={() => {
                  const next = nav.find((n) => !openTabs.includes(n.label));
                  if (next) goto(next.label);
                }}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <main className="space-y-5 p-4 sm:p-6">
          {view === "Dashboard" && (
            <>
              {/* Feature 6 — Smart triage strip */}
              <Card
                title="Today's work queue"
                subtitle="Sorted by urgency, missed check-ins and court dates"
                action="Open full queue"
                onAction={() => goto("Today's Work")}
              >
                <ul className="divide-y divide-border">
                  {triage.slice(0, 4).map((item, idx) => {
                    const s = tierStyles[item.tier];
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => openCase(item.id)}
                          className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {item.alias} · {item.id}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.reason}</p>
                          </div>
                          <TierBadge tier={item.tier} />
                          <span className={`hidden h-2 w-2 rounded-full sm:block ${s.dot}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {todayCheckIn && (
                <div
                  className={`rounded-2xl border p-4 text-sm text-foreground ${
                    todayCheckIn.safety === "no"
                      ? "border-urgent/40 bg-urgent-soft"
                      : "border-priority/30 bg-priority-soft"
                  }`}
                >
                  <p className="font-semibold">
                    {todayCheckIn.safety === "no" ? "Crisis check-in — " : ""}
                    Guided / synced check-in from Kavita (STH-221) — suggested tier:{" "}
                    <span className="capitalize">{todayCheckIn.suggestedTier}</span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Mood {todayCheckIn.mood + 1}/5 · Sleep {todayCheckIn.sleep} · Safety{" "}
                    {todayCheckIn.safety}
                    {todayCheckIn.note ? ` · “${todayCheckIn.note}”` : ""}
                  </p>
                  {todayCheckIn.safety === "no" && (
                    <p className="mt-2 text-xs font-semibold text-urgent">
                      Playbook: confirm 112/181 path · silent alert acknowledged · open assessment
                    </p>
                  )}
                </div>
              )}

              {careMarks[0] && (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                  <p className="font-semibold text-foreground">Latest caregiver mark</p>
                  <p className="mt-1 text-muted-foreground">
                    {careMarks[0].alias}: {careMarks[0].safeToday ? "Safe today" : "Needs attention"} ·
                    Appt {careMarks[0].appointmentConfirmed ? "confirmed" : "not confirmed"} ·{" "}
                    {careMarks[0].at}
                  </p>
                </div>
              )}

              {/* Tier cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {tierCounts.map((t) => {
                  const Icon = tierIcon[t.tier];
                  const s = tierStyles[t.tier];
                  return (
                    <button
                      key={t.tier}
                      onClick={() => setFilter(filter === t.tier ? "all" : t.tier)}
                      className={`flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-card transition-shadow hover:shadow-lg ${
                        filter === t.tier ? "border-brand" : "border-border"
                      }`}
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${s.dot}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-2xl font-bold text-foreground">{t.count}</p>
                        <p className={`text-sm font-semibold ${s.text}`}>{tierLabel[t.tier]}</p>
                        <p className="text-xs text-muted-foreground">{t.hint}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-4">
                {/* Predictive Risk Forecast */}
                <Card title="Predictive Risk Forecast" subtitle="AI Escalation Warning">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-4 flex items-center gap-3 rounded-xl border border-urgent/30 bg-urgent-soft p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-urgent text-white">
                          <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-urgent">85% Escalation Risk</p>
                          <p className="text-xs text-urgent/80">3 cases predicted to crisis in 48h</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">High-Risk Watchlist</p>
                      <ul className="space-y-2">
                        {cases.filter(c => c.tier === 'urgent' || c.tier === 'priority').slice(0, 3).map((c, i) => (
                          <li key={c.id} className="flex items-center justify-between text-sm">
                            <button onClick={() => openCase(c.id)} className="font-medium hover:underline text-left truncate flex-1">
                              {c.alias}
                            </button>
                            <span className="text-xs text-urgent bg-urgent/10 px-2 py-0.5 rounded-full ml-2 shrink-0">
                              {['92%', '84%', '78%'][i]} risk
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button variant="outline" className="mt-4 w-full text-xs" onClick={() => goto("Priority Cases")}>
                      Review Watchlist
                    </Button>
                  </div>
                </Card>

                {/* Donut */}
                <Card title="Case Status Overview">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="relative h-52 w-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donut}
                            dataKey="value"
                            innerRadius={62}
                            outerRadius={95}
                            paddingAngle={1}
                            stroke="none"
                            onClick={(d: { tier?: string }) =>
                              d?.tier && setFilter(d.tier as Tier)
                            }
                          >
                            {donut.map((d) => (
                              <Cell
                                key={d.tier}
                                className="cursor-pointer"
                                fill={tierStyles[d.tier as Tier].stroke}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="font-display text-3xl font-bold text-foreground">{totalCases}</p>
                        <p className="text-xs text-muted-foreground">Total Cases</p>
                      </div>
                    </div>
                    <ul className="flex-1 space-y-3">
                      {tierCounts.map((t) => (
                        <li key={t.tier}>
                          <button
                            onClick={() => setFilter(t.tier)}
                            className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-muted"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full ${tierStyles[t.tier].dot}`} />
                            <span className="flex-1 text-left text-foreground">{tierLabel[t.tier]}</span>
                            <span className="text-muted-foreground">
                              {t.count} ({((t.count / totalCases) * 100).toFixed(1)}%)
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Trend */}
                <Card title="Trend Overview" subtitle="(All Cases)">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Average Well-being Score
                  </p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendSeries} margin={{ left: -20, right: 8, top: 8 }}>
                        <defs>
                          <linearGradient id="wb" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis domain={[1, 5]} tickLine={false} axisLine={false} fontSize={11} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="var(--brand)"
                          strokeWidth={2}
                          fill="url(#wb)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <button
                    onClick={() => goto("Reports")}
                    className="mt-2 flex items-center gap-1 text-sm font-semibold text-brand"
                  >
                    View Analytics <ArrowRight className="h-4 w-4" />
                  </button>
                </Card>

                {/* Alerts */}
                <Card title="Recent Alerts" action="View All" onAction={() => goto("Alerts")}>
                  <ul className="divide-y divide-border">
                    {alerts.map((a) => {
                      const Icon = tierIcon[a.tier];
                      const s = tierStyles[a.tier];
                      return (
                        <li key={a.id}>
                          <button
                            onClick={() => openCase(a.id)}
                            className="flex w-full gap-3 py-3 text-left hover:opacity-80"
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${s.soft}`}
                            >
                              <Icon className={`h-4 w-4 ${s.text}`} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">{a.text}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className={`text-xs font-semibold ${s.text}`}>
                                  {tierLabel[a.tier]}
                                </span>
                                <span className="text-xs text-muted-foreground">{a.time}</span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                {/* Cases table */}
                <div className="xl:col-span-2">
                  <Card title="My Cases at a Glance">
                    <CaseTable
                      rows={rows}
                      filter={filter}
                      setFilter={setFilter}
                      poaFilter={poaFilter}
                      setPoaFilter={setPoaFilter}
                      query={query}
                      setQuery={setQuery}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onAction={(id) => setAssessmentId(id)}
                      onOpenXAI={(c) => {
                        setXaiTargetCase({
                          name: c.alias,
                          score: c.tier === 'urgent' ? 88 : c.tier === 'priority' ? 74 : c.tier === 'review' ? 58 : 32,
                          tier: c.tier,
                          category: c.note,
                        });
                        setXaiModalOpen(true);
                      }}
                    />
                  </Card>
                </div>

                {/* Selected case */}
                <Card title="Selected Case" action={selected.id}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {selected.alias.charAt(0)}
                    </span>
                    <div>
                      <p className="font-display text-base font-bold text-foreground">
                        {selected.alias}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Case ID: {selected.id} · Stage: {selected.stage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Language: {selected.language} · Channel: {selected.channel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assigned: {selectedCounsellor}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-4 rounded-xl p-4 ${tierStyles[selected.tier].soft}`}>
                    <p className="text-sm font-semibold text-foreground">Why Flagged?</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
                      {whyFlagged.map((w) => (
                        <li key={w} className="flex gap-2">
                          <span
                            className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tierStyles[selected.tier].dot}`}
                          />
                          {w}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setTimelineOpen(true)}
                        className="text-sm font-semibold text-brand"
                      >
                        View Timeline &amp; Details →
                      </button>
                      <TierBadge tier={selected.tier} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-foreground">Recommended Next Step</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Conduct a human assessment and plan appropriate support. AI suggestions always
                      need your confirmation.
                    </p>
                    <Button
                      onClick={() => setAssessmentId(selected.id)}
                      className="mt-3 h-11 w-full text-sm font-semibold"
                    >
                      <ClipboardCheck className="mr-1 h-4 w-4" /> Start Assessment
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 h-11 w-full text-sm font-semibold"
                      onClick={() => goto("Messages")}
                    >
                      <MessageCircle className="mr-1 h-4 w-4" /> Open secure chat
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 h-11 w-full text-sm font-semibold"
                      onClick={() => {
                        setHandoffTo(counsellors.find((c) => c !== selectedCounsellor) ?? counsellors[0]!);
                        setHandoffReason("");
                        setHandoffOpen(true);
                      }}
                    >
                      <UserRoundCog className="mr-1 h-4 w-4" /> Hand off / reassign
                    </Button>
                    <a
                      href="tel:112"
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      <Phone className="h-4 w-4" /> Call {selected.alias.split(" ")[0]}
                    </a>
                    <Link
                      to="/victim"
                      className="mt-2 block text-center text-xs font-medium text-muted-foreground hover:text-brand"
                    >
                      Preview victim app view
                    </Link>

                    {/* Feature 6 — Counsellor Notes Panel */}
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <StickyNote className="h-4 w-4 text-brand" /> My private notes
                      </p>
                      {counsellorNotes[selected.id] && !noteSaved[selected.id] === false && (
                        <p className="mb-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground italic">
                          {counsellorNotes[selected.id]}
                        </p>
                      )}
                      <Textarea
                        placeholder={`Private notes for ${selected.alias}…`}
                        value={noteDraft[selected.id] ?? counsellorNotes[selected.id] ?? ""}
                        onChange={(e) => {
                          setNoteDraft((d) => ({ ...d, [selected.id]: e.target.value }));
                          setNoteSaved((s) => ({ ...s, [selected.id]: false }));
                        }}
                        className="min-h-[80px] resize-none text-sm"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Visible only to you
                        </span>
                        {noteSaved[selected.id] ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-routine">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!noteDraft[selected.id]?.trim()}
                            onClick={() => {
                              setCounsellorNotes((n) => ({ ...n, [selected.id]: noteDraft[selected.id] ?? "" }));
                              setNoteSaved((s) => ({ ...s, [selected.id]: true }));
                              toast.success("Note saved for " + selected.alias);
                            }}
                          >
                            Save note
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {view === "Today's Work" && (
            <Card
              title="Smart triage queue"
              subtitle="Urgent first, then missed check-ins and court-adjacent cases"
              action={`${triage.length} items`}
            >
              <ul className="divide-y divide-border">
                {triage.map((item, idx) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {item.alias} · {item.id}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Counsellor: {assignedMap[item.id] ?? "—"}
                      </p>
                    </div>
                    <TierBadge tier={item.tier} />
                    <Button size="sm" variant="outline" onClick={() => openCase(item.id)}>
                      Open
                    </Button>
                    <Button size="sm" onClick={() => setAssessmentId(item.id)}>
                      Assess
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {view === "Messages" && (
            <Card title="Secure messages" subtitle="Victim chat — STH-221 Kavita (Alias)">
              <SecureChat
                role="counsellor"
                title="Chat with Kavita"
                subtitle="End-to-end demo thread stored only on this device"
                placeholder="Write a supportive reply…"
                sendLabel="Send"
                requestCallLabel="Suggest a call"
              />
            </Card>
          )}

          {view === "Notifications" && (
            <Card title="Reminders & notifications">
              <NotificationsCentre
                items={notifs}
                onRead={(id) =>
                  setNotifs(
                    markNotificationRead(id).filter(
                      (n) => n.forRole === "counsellor" || n.forRole === "all",
                    ),
                  )
                }
                onReadAll={() =>
                  setNotifs(
                    markAllNotificationsRead("counsellor").filter(
                      (n) => n.forRole === "counsellor" || n.forRole === "all",
                    ),
                  )
                }
              />
            </Card>
          )}

          {view === "Wellbeing" && (
            <div className="space-y-5">
              <Card
                title="14-day wellbeing — STH-221"
                subtitle="Mood score with chat activity spikes"
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodHistory14} margin={{ left: -20, right: 8, top: 8 }}>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                      <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="chat"
                        stroke="var(--priority)"
                        strokeWidth={2}
                        name="Chat msgs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Chat spikes often align with dips before hearing dates — confirm with human assessment.
                </p>
                {/* Sentiment Analysis Panel */}
                <div className="mt-4 rounded-xl border border-review/30 bg-review/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-review uppercase tracking-wider">
                    <span>💬</span> NLP Sentiment Analysis — Last 3 messages
                  </p>
                  <ul className="space-y-2">
                    {[
                      { text: "I am scared they will find me before the next hearing", sentiment: "Negative", emotion: "Fear", score: -0.82 },
                      { text: "The lawyer said we have strong evidence, that helped", sentiment: "Mixed", emotion: "Cautious Hope", score: 0.15 },
                      { text: "I didn't sleep again last night, too anxious", sentiment: "Negative", emotion: "Anxiety", score: -0.74 },
                    ].map((msg, i) => (
                      <li key={i} className="rounded-lg bg-card border border-border p-2.5 text-sm">
                        <p className="text-muted-foreground italic mb-1">"{msg.text}"</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${msg.sentiment === 'Negative' ? 'bg-urgent/10 text-urgent' : 'bg-review/20 text-review'}`}>
                            {msg.sentiment === 'Negative' ? '⬇ ' : '↔ '}{msg.sentiment} Sentiment ({msg.score > 0 ? '+' : ''}{msg.score.toFixed(2)})
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${msg.emotion === 'Fear' || msg.emotion === 'Anxiety' ? 'bg-urgent/10 text-urgent' : 'bg-brand/10 text-brand'}`}>
                            🧠 {msg.emotion}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card title="IVRS / voice check-ins" action={`${ivrsLogs.length} logged`}>
                {ivrsLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No IVRS logs yet. Victim can run the voice simulator from their app.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {ivrsLogs.slice(0, 8).map((l, idx) => (
                      <li key={l.id} className="py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            Mood {l.mood + 1}/5 · {l.sleep} · {l.safety}
                          </span>
                          <span className="flex items-center gap-2">
                            <TierBadge tier={l.suggestedTier} />
                            <span className="text-xs text-muted-foreground">{l.at}</span>
                          </span>
                        </div>
                        {/* Voice Stress & Emotion AI from IVRS analysis */}
                        {(() => {
                          const stressLevels = ['High','Medium','Medium-High','Low','High'] as const;
                          const emotions = ['Fear','Neutral','Anxiety','Calm','Panic'] as const;
                          const stress = stressLevels[idx % stressLevels.length];
                          const emotion = emotions[idx % emotions.length];
                          return (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                stress === 'High' || stress === 'Medium-High'
                                  ? 'bg-urgent/10 text-urgent'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                🎙 Voice Stress: {stress}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                emotion === 'Fear' || emotion === 'Panic' ? 'bg-urgent/10 text-urgent' :
                                emotion === 'Anxiety' ? 'bg-priority/10 text-priority' :
                                'bg-brand/10 text-brand'
                              }`}>
                                🧠 Emotion: {emotion}
                              </span>
                              {l.safety !== 'yes' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-review/20 text-review px-2 py-0.5 text-xs font-semibold">
                                  💬 Negative Sentiment Detected
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Caregiver marks" action={`${careMarks.length}`}>
                {careMarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No caregiver marks yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {careMarks.slice(0, 6).map((m) => (
                      <li key={m.id} className="py-2 text-sm">
                        <p className="font-semibold text-foreground">
                          {m.alias} — {m.safeToday ? "Safe today" : "Needs attention"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Appt {m.appointmentConfirmed ? "confirmed" : "not confirmed"} · {m.at}
                          {m.note ? ` · ${m.note}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {(view === "Assigned Cases" || view === "All Cases" || view === "Priority Cases") && (
            <Card title={view} action={`${rows.length} shown`}>
              <CaseTable
                rows={rows}
                filter={filter}
                setFilter={setFilter}
                poaFilter={poaFilter}
                setPoaFilter={setPoaFilter}
                query={query}
                setQuery={setQuery}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAction={(id) => setAssessmentId(id)}
                onOpenXAI={(c) => {
                  setXaiTargetCase({
                    name: c.alias,
                    score: c.tier === 'urgent' ? 88 : c.tier === 'priority' ? 74 : c.tier === 'review' ? 58 : 32,
                    tier: c.tier,
                    category: c.note,
                  });
                  setXaiModalOpen(true);
                }}
              />
            </Card>
          )}

          {xaiTargetCase && (
            <XAIExplanationModal
              isOpen={xaiModalOpen}
              onClose={() => setXaiModalOpen(false)}
              victimName={xaiTargetCase.name}
              distressScore={xaiTargetCase.score}
              riskTier={xaiTargetCase.tier}
              category={xaiTargetCase.category}
            />
          )}

          {view === "Calendar" && (
            <div className="space-y-5">
              <Card title="Schedule" subtitle="(Next 7 days)">
                <ul className="divide-y divide-border">
                  {calendarEvents.map((e) => (
                    <li key={e.title} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-14 flex-col items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
                        <span>{e.date}</span>
                        <span className="text-[10px] text-muted-foreground">{e.time}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.type}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success(`Reminder set for ${e.title}`)}
                      >
                        <Clock className="mr-1 h-3.5 w-3.5" /> Remind me
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Victim-booked sessions" action={`${bookedAppts.length} booked`}>
                {bookedAppts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No victim bookings yet. When Kavita books a slot, it appears here.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {bookedAppts.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {a.alias} · {a.caseId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.when} · booked by {a.createdBy}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openCase(a.caseId)}>
                          Open case
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {view === "Alerts" && (
            <Card title="All Alerts" action={`${alerts.length - handled.length} open`}>
              <ul className="divide-y divide-border">
                {alerts.map((a) => {
                  const Icon = tierIcon[a.tier];
                  const s = tierStyles[a.tier];
                  const done = handled.includes(a.id);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${s.soft}`}
                      >
                        <Icon className={`h-4 w-4 ${s.text}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {a.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tierLabel[a.tier]} · {a.time}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openCase(a.id)}>
                        Open case
                      </Button>
                      <Button
                        size="sm"
                        variant={done ? "secondary" : "default"}
                        onClick={() => {
                          setHandled((h) => (h.includes(a.id) ? h.filter((x) => x !== a.id) : [...h, a.id]));
                          if (!done) toast.success(`${a.id} marked as handled`);
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {done ? "Undo" : "Mark handled"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {view === "Reports" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Average Well-being Over Time">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendSeries} margin={{ left: -20, right: 8, top: 8 }}>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis domain={[1, 5]} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        fill="url(#wb)"
                      />
                      <defs>
                        <linearGradient id="wb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Cases by Risk Tier">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tierCounts.map((t) => ({ name: tierLabel[t.tier], count: t.count, tier: t.tier }))}
                      margin={{ left: -20, right: 8, top: 8 }}
                    >
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {tierCounts.map((t) => (
                          <Cell key={t.tier} fill={tierStyles[t.tier].stroke} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Caseload Summary">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <Stat label="Total cases" value={String(totalCases)} />
                  <Stat label="Check-ins this week" value="48" />
                  <Stat label="Assessments completed" value="12" />
                  <Stat label="Average response time" value="1h 40m" />
                </dl>
              </Card>
              <Card title="Export">
                <p className="text-sm text-muted-foreground">
                  Generate an anonymised monthly report for supervision review.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => toast.success("Monthly report generated (demo)")}
                >
                  Generate report
                </Button>
              </Card>
            </div>
          )}

          {view === "Resources" && (
            <Card title="Counsellor Resources">
              <ul className="divide-y divide-border">
                {resources.map((r) => (
                  <li key={r.title} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(`"${r.title}" opens in the resource library (demo)`)}
                    >
                      Open
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {view === "Settings" && (
            <Card title="Settings">
              <ul className="divide-y divide-border">
                {(
                  [
                    ["urgentPush", "Urgent alert notifications", "Get notified instantly for urgent tier changes"],
                    ["dailyDigest", "Daily case digest", "One summary email every morning at 8 AM"],
                    ["aliasOnly", "Show aliases only", "Hide real names across the dashboard"],
                  ] as const
                ).map(([key, title, detail]) => (
                  <li key={key} className="flex items-center gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(v) => {
                        setPrefs((p) => ({ ...p, [key]: v }));
                        toast.success(`${title} ${v ? "enabled" : "disabled"}`);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {view === "Support" && (
            <Card title="Support &amp; Helplines">
              <div className="grid gap-3 sm:grid-cols-2">
                {helplines.map((h) => (
                  <a
                    key={h.number}
                    href={`tel:${h.number}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-urgent text-white">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground">Call {h.number}</p>
                    </div>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                For platform help, contact your district supervisor or write to support@saathi.org.
              </p>
            </Card>
          )}
        </main>
      </div>

      {/* Assessment summary dialog */}
      <Dialog open={assessmentId !== null} onOpenChange={(o) => !o && setAssessmentId(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          {assessmentId && <AssessmentSummary id={assessmentId} onClose={() => setAssessmentId(null)} />}
        </DialogContent>
      </Dialog>

      {/* Timeline dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected.alias} · {selected.id}
            </DialogTitle>
            <DialogDescription>Case timeline and recent check-ins</DialogDescription>
          </DialogHeader>
          {(() => {
            const p = caseProfiles[selected.id];
            if (!p) return <p className="text-sm text-muted-foreground">No timeline recorded yet.</p>;
            return (
              <div className="space-y-4">
                <ol className="space-y-3 border-l border-border pl-4">
                  {p.timeline.map((t) => (
                    <li key={t.date + t.event} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                      <p className="text-sm font-semibold text-foreground">{t.event}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </li>
                  ))}
                </ol>
                <div>
                  <p className="text-sm font-semibold text-foreground">Recent check-ins</p>
                  <ul className="mt-2 space-y-2">
                    {p.checkIns.map((c) => (
                      <li key={c.date} className="rounded-lg border border-border bg-muted/30 p-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground shrink-0">
                            {c.score.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground flex-1">
                            {c.date} — {c.note}
                          </span>
                        </div>
                        {(c.voiceStress || c.emotion) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.voiceStress && (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                c.voiceStress === 'High' ? 'bg-urgent/10 text-urgent' :
                                c.voiceStress === 'Medium-High' ? 'bg-priority/10 text-priority' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                🎙 Voice Stress: {c.voiceStress}
                              </span>
                            )}
                            {c.emotion && (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                c.emotion === 'Fear' || c.emotion === 'Panic' ? 'bg-urgent/10 text-urgent' :
                                c.emotion === 'Anxiety' || c.emotion === 'Stress' ? 'bg-priority/10 text-priority' :
                                'bg-brand/10 text-brand'
                              }`}>
                                🧠 Emotion AI: {c.emotion}
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Feature 8 — Hand-off / reassignment */}
      <Dialog open={handoffOpen} onOpenChange={setHandoffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hand off {selected.alias}</DialogTitle>
            <DialogDescription>
              Reassign {selected.id} with a reason. An audit entry is saved on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Currently assigned</p>
              <p className="text-sm font-semibold text-foreground">{selectedCounsellor}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Transfer to</p>
              <div className="grid gap-2">
                {counsellors
                  .filter((c) => c !== selectedCounsellor)
                  .map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHandoffTo(c)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                        handoffTo === c
                          ? "border-brand bg-brand/8 ring-2 ring-brand/25"
                          : "border-border"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Reason</p>
              <Textarea
                value={handoffReason}
                onChange={(e) => setHandoffReason(e.target.value)}
                placeholder="e.g. Language match, leave cover, specialised trauma support…"
                className="min-h-[80px] resize-none"
              />
            </div>
            <Button
              className="w-full"
              disabled={!handoffReason.trim()}
              onClick={() => {
                const list = addHandoff({
                  caseId: selected.id,
                  alias: selected.alias,
                  fromCounsellor: selectedCounsellor,
                  toCounsellor: handoffTo,
                  reason: handoffReason.trim(),
                });
                setHandoffs(list);
                setAssignedMap((m) => ({ ...m, [selected.id]: handoffTo }));
                setHandoffOpen(false);
                toast.success(`${selected.id} handed off to ${handoffTo}`);
              }}
            >
              Confirm hand-off
            </Button>
            {handoffs.filter((h) => h.caseId === selected.id).length > 0 && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground">Audit trail</p>
                <ul className="mt-2 space-y-2">
                  {handoffs
                    .filter((h) => h.caseId === selected.id)
                    .map((h) => (
                      <li key={h.id} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {h.fromCounsellor} → {h.toCounsellor}
                        </span>
                        <br />
                        {h.reason} · {h.at}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssessmentSummary({ id, onClose }: { id: string; onClose: () => void }) {
  const row = cases.find((c) => c.id === id)!;
  const p = caseProfiles[id];
  const s = tierStyles[row.tier];

  if (!p) {
    return (
      <DialogHeader>
        <DialogTitle>No summary available</DialogTitle>
        <DialogDescription>This case has no assessment record yet.</DialogDescription>
      </DialogHeader>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display flex flex-wrap items-center gap-2 text-lg">
          Assessment — {row.alias}
          <TierBadge tier={row.tier} />
        </DialogTitle>
        <DialogDescription>
          Case {p.id} · {p.caseType} · Stage: {row.stage}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Age" value={`${p.age} yrs`} />
        <Stat label="Well-being" value={p.wellbeing.toFixed(1)} />
        <Stat label="Risk level" value={p.riskLevel} />
        <Stat label="Registered" value={p.registered} />
      </div>

        {/* Distress Score Panel */}
        <div className="mb-2">
          <p className="font-display text-base font-semibold text-foreground">Distress Score</p>
          <p className="text-xs text-muted-foreground">AI‑derived dynamic distress metric</p>
        </div>
        <WellnessScoreCard result={getLatestWellness()} compact={false} />

      <div className={`rounded-xl p-4 ${s.soft}`}>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4" /> Brief summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{p.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-urgent" /> Current concerns
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {p.concerns.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-urgent" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-brand" /> Protective strengths
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {p.strengths.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Last three check-ins</p>
        <ul className="mt-2 space-y-2">
          {p.checkIns.map((c) => (
            <li key={c.date} className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">
              <div className="flex items-start gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground shrink-0">
                  {c.score.toFixed(1)}
                </span>
                <span className="text-muted-foreground flex-1">
                  {c.date} — {c.note}
                </span>
              </div>
              {(c.voiceStress || c.emotion) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.voiceStress && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.voiceStress === 'High' ? 'bg-urgent/10 text-urgent' :
                      c.voiceStress === 'Medium-High' ? 'bg-priority/10 text-priority' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      🎙 Voice Stress: {c.voiceStress}
                    </span>
                  )}
                  {c.emotion && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.emotion === 'Fear' || c.emotion === 'Panic' ? 'bg-urgent/10 text-urgent' :
                      c.emotion === 'Anxiety' || c.emotion === 'Stress' ? 'bg-priority/10 text-priority' :
                      'bg-brand/10 text-brand'
                    }`}>
                      🧠 Emotion AI: {c.emotion}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Supports in place: {p.supports.join(" · ")} · Last assessment: {p.lastAssessment} · Contact
          preference: {row.language} on {row.channel}
        </p>
      </div>

      {/* XAI Reasoning */}
      {p.xaiReasoning && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
          <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-brand">
            <span className="text-base">🤖</span> Explainable AI — Risk Score Reasoning
          </p>
          <p className="text-sm text-muted-foreground">{p.xaiReasoning}</p>
        </div>
      )}

      {/* AI Interventions */}
      {p.aiInterventions && p.aiInterventions.length > 0 && (
        <div className="rounded-xl border border-priority/30 bg-priority-soft p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-priority">
            <span className="text-base">⚡</span> AI-Recommended Interventions
          </p>
          <ul className="space-y-1.5">
            {p.aiInterventions.map((intervention) => (
              <li key={intervention} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-priority" />
                <span className="text-foreground font-medium">{intervention}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            toast.success(`Assessment started for ${p.id}`);
            onClose();
          }}
        >
          <ClipboardCheck className="mr-1 h-4 w-4" /> Begin human assessment
        </Button>
        <a
          href="tel:112"
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <Phone className="h-4 w-4" /> Call now
        </a>
      </div>
    </>
  );
}

function CaseTable({
  rows,
  filter,
  setFilter,
  poaFilter,
  setPoaFilter,
  query,
  setQuery,
  selectedId,
  onSelect,
  onAction,
  onOpenXAI,
}: {
  rows: typeof cases;
  filter: "all" | Tier;
  setFilter: (f: "all" | Tier) => void;
  poaFilter: string;
  setPoaFilter: (f: string) => void;
  query: string;
  setQuery: (q: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onAction: (id: string) => void;
  onOpenXAI: (c: (typeof cases)[0]) => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Tier status pills */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "urgent", "priority", "review", "routine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f === "all" ? "All Status" : tierLabel[f]}
            </button>
          ))}
        </div>

        {/* SC/ST PoA Offence Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Offence Category:</span>
          <select
            value={poaFilter}
            onChange={(e) => setPoaFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All SC/ST (PoA) Categories</option>
            <option value="rape">Rape &amp; Gang Rape Victims</option>
            <option value="murder_arson">Murder, Arson &amp; Grievous Hurt</option>
            <option value="witness_threat">Witness Intimidation / Threats</option>
            <option value="caste_violence">Caste-Based Discrimination &amp; Violence</option>
          </select>
        </div>

        <div className="relative ml-auto w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Case ID / Name..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-3 pr-3 font-medium">Case ID</th>
              <th className="pb-3 pr-3 font-medium">Name / Alias</th>
              <th className="pb-3 pr-3 font-medium">Status</th>
              <th className="pb-3 pr-3 font-medium">Well-being Trend</th>
              <th className="pb-3 pr-3 font-medium">Last Check-in</th>
              <th className="pb-3 pr-3 font-medium">XAI Risk Evidence</th>
              <th className="pb-3 font-medium">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/50 ${
                  selectedId === c.id ? "bg-brand/5" : ""
                }`}
              >
                <td className="py-3 pr-3 font-semibold text-foreground">{c.id}</td>
                <td className="py-3 pr-3 text-foreground">{c.alias}</td>
                <td className="py-3 pr-3">
                  <TierBadge tier={c.tier} />
                </td>
                <td className="py-3 pr-3">
                  <Sparkline data={c.trend} color={tierStyles[c.tier].stroke} />
                </td>
                <td className="py-3 pr-3">
                  <p className="text-foreground">{c.lastCheckIn}</p>
                  <p className={`text-xs ${tierStyles[c.tier].text}`}>{c.note}</p>
                </td>
                <td className="py-3 pr-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenXAI(c);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline bg-brand/10 px-2.5 py-1 rounded-md"
                  >
                    <Brain className="h-3.5 w-3.5" /> Explain Risk
                  </button>
                </td>
                <td className="py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(c.id);
                      onAction(c.id);
                    }}
                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 ${tierStyles[c.tier].soft} ${tierStyles[c.tier].text}`}
                  >
                    {c.action}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No cases match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="saathi-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-foreground">
          {title} {subtitle && <span className="font-medium text-muted-foreground">{subtitle}</span>}
        </h2>
        {action &&
          (onAction ? (
            <button onClick={onAction} className="text-sm font-semibold text-brand hover:underline">
              {action}
            </button>
          ) : (
            <span className="text-sm font-semibold text-[oklch(0.5_0.08_300)]">{action}</span>
          ))}
      </div>
      {children}
    </section>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
