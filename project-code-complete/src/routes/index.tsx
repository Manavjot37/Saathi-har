import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  HeartHandshake,
  Leaf,
  Lock,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleDisplay, roleHome, saveSession, type Role } from "@/lib/auth";
import { isRtl, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAATHI — Victim Support & Counsellor Login" },
      {
        name: "description",
        content:
          "Secure sign-in for SAATHI: counsellors, victims, caregivers and supervisors.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("counsellor");
  const [identifier, setIdentifier] = useState("");
  const { lang, setLang, t } = useLanguage();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = roleDisplay[role];
    saveSession({ role, name: meta.name, id: meta.id });
    navigate({ to: roleHome[role] });
  };

  return (
    <main
      className="saathi-grain relative min-h-screen overflow-hidden bg-background"
      dir={isRtl(lang) ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="saathi-leaf-pattern absolute inset-y-0 left-0 hidden w-[48%] lg:block" />
        <div className="absolute -right-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-[oklch(0.82_0.06_300/0.35)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[40%] h-[280px] w-[280px] rounded-full bg-[oklch(0.82_0.05_155/0.3)] blur-3xl" />
        <div className="absolute right-[20%] top-[40%] h-[220px] w-[220px] rounded-full bg-[oklch(0.84_0.05_245/0.28)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between px-12 py-14 text-sidebar-foreground lg:flex">
          <div className="saathi-rise">
            <p className="font-display text-5xl font-semibold tracking-tight">SAATHI</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sidebar-foreground/70">
              {t("appSubtitle")}
            </p>
          </div>
          <div className="saathi-rise saathi-rise-delay-1 max-w-md">
            <p className="font-display text-4xl font-semibold leading-[1.15]">
              {t("heroTitle1")}{" "}
              <span className="saathi-mark relative z-0 inline-block text-sidebar-primary">
                {t("heroHighlight")}
              </span>{" "}
              {t("heroTitle2")}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground/78">
              {[
                t("heroBullet1"),
                t("heroBullet2"),
                t("heroBullet3"),
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="saathi-rise saathi-rise-delay-2 max-w-[240px] text-[11px] text-sidebar-foreground/45">
            {t("legalNote")}
          </p>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="saathi-rise saathi-rise-delay-1 w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
              <div>
                <p className="font-display text-3xl font-semibold text-foreground">SAATHI</p>
                <p className="text-xs text-muted-foreground">{t("appTagline")}</p>
              </div>
              <LanguageToggle />
            </div>

            <div className="saathi-panel border-l-brand bg-card/90 p-6 backdrop-blur-sm sm:p-8">
              <div className="mb-6 hidden items-start justify-between gap-3 lg:flex">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                    {t("enterQuietly")}
                  </p>
                  <h1 className="font-display mt-1 text-3xl font-semibold text-foreground">
                    {t("signIn")}
                  </h1>
                </div>
                <LanguageToggle />
              </div>

              <h1 className="font-display text-3xl font-semibold text-foreground lg:hidden">
                {t("signIn")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("chooseRole")}</p>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <RoleCard
                  active={role === "counsellor"}
                  onClick={() => setRole("counsellor")}
                  icon={<Shield className="h-4 w-4" />}
                  title={t("counsellor")}
                  subtitle={t("counsellorSub")}
                />
                <RoleCard
                  active={role === "victim"}
                  onClick={() => setRole("victim")}
                  icon={<UserRound className="h-4 w-4" />}
                  title={t("victim")}
                  subtitle={t("victimSub")}
                />
                <RoleCard
                  active={role === "caregiver"}
                  onClick={() => setRole("caregiver")}
                  icon={<HeartHandshake className="h-4 w-4" />}
                  title={t("caregiver")}
                  subtitle={t("caregiverSub")}
                />
                <RoleCard
                  active={role === "supervisor"}
                  onClick={() => setRole("supervisor")}
                  icon={<Eye className="h-4 w-4" />}
                  title={t("supervisor")}
                  subtitle={t("supervisorSubRole")}
                />
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wide">
                    {role === "victim" || role === "caregiver"
                      ? t("identifierLabel")
                      : "Work email / ID"}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="identifier"
                      className="h-11 rounded-sm border-border/80 bg-background/60 pl-9"
                      placeholder={
                        role === "victim" || role === "caregiver"
                          ? t("identifierPlaceholder")
                          : "you@saathi.org"
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wide">
                    {role === "victim" ? "4-digit PIN / Safe code" : "Password / Staff PIN"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="code"
                      type="password"
                      className="h-11 rounded-sm border-border/80 bg-background/60 pl-9"
                      placeholder="••••••"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-sm text-sm font-bold tracking-wide cursor-pointer">
                  {t("signInButton", { role: t(role) })}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground space-y-1">
                <p>
                  {t("directSupportLines")}:{" "}
                  <span className="font-bold text-urgent">112</span> (24x7) /{" "}
                  <span className="font-bold text-urgent">181</span> ({t("helplineWomen")})
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  {t("privacyFooter")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-sm border px-3 py-3 text-left transition-all cursor-pointer ${
        active
          ? "border-brand bg-brand/8 shadow-[inset_3px_0_0_0_var(--brand)]"
          : "border-border bg-background/50 hover:border-brand/40"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-sm ${
          active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </button>
  );
}
