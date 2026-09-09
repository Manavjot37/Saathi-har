import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HeartHandshake, LayoutDashboard, LogOut, Users, Star, Award, Lock, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { NotificationsCentre } from "@/components/notifications-centre";
import { IndiaCasesMap } from "@/components/india-cases-map";
import { StateCasesMap } from "@/components/state-cases-map";
import { XAIExplanationModal } from "@/components/xai-explanation-modal";
import { allIndiaFeatures } from "@/lib/india-map-data";
import { LanguageToggle } from "@/components/language-toggle";
import { TierBadge } from "@/components/tier-badge";
import { clearSession, readSession } from "@/lib/auth";
import { supervisorHeat, supervisorTeam } from "@/lib/extra-data";
import { districtList } from "@/lib/districtList";
import { DistrictDataTable } from "@/components/district-data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchDistrictData } from "@/lib/api";
import { useLanguage, isRtl } from "@/lib/i18n";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/saathi-store";

export const Route = createFileRoute("/supervisor")({
  head: () => ({
    meta: [
      { title: "Supervisor dashboard — SAATHI" },
      {
        name: "description",
        content: "Caseload heat map, counsellor response times, ratings and NCRB state distribution.",
      },
    ],
  }),
  component: SupervisorPage,
});

function SupervisorPage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [name, setName] = useState("Supervisor");
  const [view, setView] = useState<'district' | 'state' | 'national'>('district');
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(districtList[0] ?? "");
  const [selectedStateId, setSelectedStateId] = useState<string>("up");
  const selectedState = useMemo(() => allIndiaFeatures.find(s => s.id === selectedStateId), [selectedStateId]);
  const [xaiModalOpen, setXaiModalOpen] = useState(false);
  const [xaiTargetCase, setXaiTargetCase] = useState<{ name: string; score: number; tier: "urgent" | "high" | "moderate" | "routine"; category?: string } | null>(null);


  useEffect(() => {
    const session = readSession();
    if (session?.role === "supervisor") setName(session.name.split(" ")[0] ?? "Supervisor");
    setNotifs(loadNotifications().filter((n) => n.forRole === "supervisor" || n.forRole === "all"));
  }, []);

  const totalUrgent = supervisorTeam.reduce((s, c) => s + c.urgent, 0);
  const avgResp =
    supervisorTeam.reduce((s, c) => s + c.avgResponseHrs, 0) / supervisorTeam.length;
  const avgRating =
    supervisorTeam.reduce((s, c) => s + c.rating, 0) / supervisorTeam.length;
  const avgSatisfaction =
    Math.round(supervisorTeam.reduce((s, c) => s + c.satisfactionRate, 0) / supervisorTeam.length);

  return (
    <div className="min-h-screen bg-surface" dir={isRtl(lang) ? "rtl" : "ltr"}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">SAATHI</p>
            <p className="text-[10px] text-sidebar-foreground/60">{t("supervisor")}</p>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          <div className="flex items-center gap-3 rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-brand-foreground">
            <LayoutDashboard className="h-4 w-4" /> {t("overview")}
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80">
            <Users className="h-4 w-4" /> {t("teamCaseloads")}
          </div>
        </nav>
        <button
          onClick={() => {
            clearSession();
            navigate({ to: "/" });
          }}
          className="mx-4 mt-auto mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> {t("signOut")}
        </button>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {t("welcomeSupervisor", { name })}
            </h1>
            <Lock className="h-4 w-4 inline-block text-muted-foreground" />
            <Badge variant="secondary">GDPR Compliant</Badge>

            <p className="text-xs text-muted-foreground">
              {t("supervisorSub")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
          </div>
        </header>
{/* Level Tabs */}
<div className="flex space-x-4 mb-4">
  <button onClick={() => setView('district')} className={`px-3 py-1 rounded ${view === 'district' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>District</button>
  <button onClick={() => setView('state')} className={`px-3 py-1 rounded ${view === 'state' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>State</button>
  <button onClick={() => setView('national')} className={`px-3 py-1 rounded ${view === 'national' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>National</button>
</div>

        <main className="space-y-5 p-4 sm:p-6">
          {/* Top Summary Stat Cards */}
          {view !== 'state' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("teamUrgentCases")} value={String(totalUrgent)} hint={t("acrossAllCounsellors")} />
              <StatCard label={t("avgResponseTime")} value={`${avgResp.toFixed(1)}h`} hint={t("firstHumanReply")} />
              <StatCard
                label={t("counsellorRating")}
                value={`${avgRating.toFixed(2)} ★`}
                hint={`${avgSatisfaction}% ${t("victimSatisfaction")}`}
              />
              <StatCard
                label={t("teamCheckInRate")}
                value={`${Math.round(supervisorTeam.reduce((s, c) => s + c.checkInRate, 0) / supervisorTeam.length)}%`}
                hint={t("last7Days")}
              />
            </div>
          )}

              {view === 'district' && (
                <section className="saathi-panel p-5 overflow-x-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t("selectDistrict")} />
                      </SelectTrigger>
                      <SelectContent>
                        {districtList.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedDistrict && <DistrictDataTable district={selectedDistrict} />}
                </section>
              )}

          {view === 'state' && (
            <div className="space-y-4">
              {/* State Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t("selectState")}:</span>
                <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder={t("selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {allIndiaFeatures.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State Overview Summary */}
              {selectedState && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard label={t("stateTotalCases")} value={selectedState.periods['live'].totalCases.toLocaleString("en-IN")} hint={t("stateTotalCasesHint")} />
                  <StatCard label={t("stateUrgentCases")} value={selectedState.periods['live'].urgentCases.toLocaleString("en-IN")} hint={t("stateUrgentCasesHint")} />
                  <StatCard label={t("stateSaathiCases")} value={selectedState.periods['live'].saathiCases.toLocaleString("en-IN")} hint={t("stateSaathiCasesHint")} />
                  <StatCard label={t("stateHelplineCalls")} value={selectedState.periods['live'].helplineCalls.toLocaleString("en-IN")} hint={t("stateHelplineCallsHint")} />
                  <StatCard label={t("stateResolutionRate")} value={`${selectedState.periods['live'].resolutionRate}%`} hint={t("stateResolutionRateHint")} />
                </div>
              )}

              {/* State Map */}
              <StateCasesMap
                stateId={selectedStateId}
                className="my-4"
                onSelectDistrict={(distName) => {
                  setSelectedDistrict(distName);
                  setView('district');
                }}
              />
            </div>
          )}

          {view === 'national' && (
          <>
            {/* National Overview Summary */}
            <div className="mt-8 p-4 rounded-xl bg-surface/50 border border-border">
              <h2 className="font-display text-base font-bold text-foreground mb-2">{t("nationalOverview")}</h2>
              <p className="text-sm text-muted-foreground">{t("nationalStatsSubtitle")}</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                <li>{t("totalCounsellors")}: {supervisorTeam.length}</li>
                <li>{t("totalUrgentCases")}: {String(supervisorTeam.reduce((s, c) => s + c.urgent, 0))}</li>
                <li>{t("averageRating")}: {avgRating.toFixed(2)} ★</li>
              </ul>
              <IndiaCasesMap className="my-4" />
            </div>
          </>
        )}

          {/* Counsellor Team Performance Table with Overall Ratings */}
          <section className="saathi-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">{t("counsellorPerformance")}</h2>
                <p className="text-xs text-muted-foreground">{t("counsellorPerformanceSub")}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-brand bg-brand/10 px-2.5 py-1 rounded-full">
                <Award className="h-3.5 w-3.5" /> {t("teamAvg")}: {avgRating.toFixed(2)} / 5.0
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[1200px] w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">{t("counsellorCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("overallRatingCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("satisfactionCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("caseloadCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("urgentCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("responseCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("handoffsCol")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("checkInCol")}</th>
                    <th className="pb-2 font-medium">XAI Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorTeam.map((c) => (
                    <tr key={c.name} className="border-b border-border/60">
                      <td className="py-3 pr-3 font-semibold text-foreground">{c.name}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>{c.rating.toFixed(1)}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">({c.reviewsCount})</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-routine/10 px-2 py-0.5 text-xs font-semibold text-routine">
                          {c.satisfactionRate}%
                        </span>
                      </td>
                      <td className="py-3 pr-3">{c.caseload}</td>
                      <td className="py-3 pr-3">
                        {c.urgent > 0 ? <TierBadge tier="urgent" /> : <span className="text-muted-foreground">0</span>}
                        {c.urgent > 1 && <span className="ml-1 text-xs text-urgent">×{c.urgent}</span>}
                      </td>
                      <td className="py-3 pr-3">{c.avgResponseHrs.toFixed(1)}h</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        in {c.handoffsIn} / out {c.handoffsOut}
                      </td>
                      <td className="py-3 pr-3 font-medium">{c.checkInRate}%</td>
                      <td className="py-3">
                        <button
                          onClick={() => {
                            setXaiTargetCase({
                              name: `Caseload managed by ${c.name}`,
                              score: c.urgent > 0 ? 84 : 42,
                              tier: c.urgent > 0 ? "urgent" : "routine",
                              category: "SC/ST (PoA) Act Multi-District Supervision",
                            });
                            setXaiModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline bg-brand/10 px-2 py-1 rounded"
                        >
                          <Brain className="h-3.5 w-3.5" /> XAI Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

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

          <section className="saathi-panel p-5">
            <NotificationsCentre
              title={t("supervisorAlerts")}
              items={notifs}
              onRead={(id) =>
                setNotifs(
                  markNotificationRead(id).filter(
                    (n) => n.forRole === "supervisor" || n.forRole === "all",
                  ),
                )
              }
              onReadAll={() =>
                setNotifs(
                  markAllNotificationsRead("supervisor").filter(
                    (n) => n.forRole === "supervisor" || n.forRole === "all",
                  ),
                )
              }
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="saathi-panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
