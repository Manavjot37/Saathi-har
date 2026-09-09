import type { Tier } from "@/lib/mock-data";
import { analyzeText } from "@/lib/nlp-analyzer";

const CHAT_KEY = "saathi_chat_STH-221";
const APPTS_KEY = "saathi_appointments";
const CHECKIN_KEY = "saathi_checkin_today";
const HANDOFF_KEY = "saathi_handoffs";
const CASES_META_KEY = "saathi_cases_meta";

export type ChatMessage = {
  id: string;
  from: "victim" | "counsellor";
  text: string;
  at: string;
  read: boolean;
  kind?: "text" | "call_request" | undefined;
  encrypted?: boolean | undefined;
  distress?: {
    level: "low" | "moderate" | "high" | "crisis";
    score: number;
    dominantEmotion: string;
    crisisFlag: boolean;
  } | undefined;
};

export type Appointment = {
  id: string;
  caseId: string;
  alias: string;
  when: string;
  slotId: string;
  status: "booked" | "cancelled";
  createdBy: "victim" | "counsellor";
};

export type CheckInResult = {
  date: string;
  mood: number; // 0-4
  sleep: "poor" | "ok" | "good";
  safety: "yes" | "unsure" | "no";
  note: string;
  suggestedTier: Tier;
};

export type HandoffRecord = {
  id: string;
  caseId: string;
  alias: string;
  fromCounsellor: string;
  toCounsellor: string;
  reason: string;
  at: string;
};

export type CaseMeta = {
  counsellor: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const defaultChat: ChatMessage[] = [
  {
    id: "m1",
    from: "counsellor",
    text: "Namaste Kavita. I'm here whenever you need to talk. How are you feeling about tomorrow's call?",
    at: "Yesterday, 6:40 PM",
    read: true,
  },
  {
    id: "m2",
    from: "victim",
    text: "A little nervous, but the breathing exercise helped last night.",
    at: "Yesterday, 7:05 PM",
    read: true,
  },
  {
    id: "m3",
    from: "counsellor",
    text: "That's good to hear. We can keep tomorrow's call short if you prefer.",
    at: "Yesterday, 7:12 PM",
    read: true,
  },
];

export function loadChat(): ChatMessage[] {
  return readJson(CHAT_KEY, defaultChat);
}

export function saveChat(messages: ChatMessage[]) {
  writeJson(CHAT_KEY, messages);
}

export function appendChat(msg: Omit<ChatMessage, "id" | "at" | "read">): ChatMessage[] {
  const list = loadChat();

  let distressInfo = msg.distress;
  if (!distressInfo && msg.from === "victim" && msg.text) {
    const analysis = analyzeText(msg.text);
    distressInfo = {
      level: analysis.level,
      score: analysis.score,
      dominantEmotion: analysis.dominantEmotion,
      crisisFlag: analysis.crisisFlag,
    };
    if (analysis.level === "high" || analysis.level === "crisis") {
      addNotification({
        title: `AI Alert: ${analysis.level.toUpperCase()} distress in chat`,
        body: `STH-221 message flagged with high distress (${analysis.score}/100 - ${analysis.dominantEmotion}).`,
        kind: "crisis",
        forRole: "counsellor",
      });
    }
  }

  const next: ChatMessage = {
    ...msg,
    distress: distressInfo,
    id: `m${Date.now()}`,
    at: new Date().toLocaleString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    read: false,
  };
  const updated = [...list, next];
  saveChat(updated);
  return updated;
}

export function markChatRead(role: "victim" | "counsellor"): ChatMessage[] {
  const list = loadChat().map((m) =>
    m.from !== role && !m.read ? { ...m, read: true } : m,
  );
  saveChat(list);
  return list;
}

export type Slot = {
  id: string;
  label: string;
  when: string;
};

export const availableSlots: Slot[] = [
  { id: "s1", label: "Tomorrow · 11:00 AM", when: "Tomorrow, 11:00 AM" },
  { id: "s2", label: "Tomorrow · 4:30 PM", when: "Tomorrow, 04:30 PM" },
  { id: "s3", label: "Wed · 10:00 AM", when: "Wed, 10:00 AM" },
  { id: "s4", label: "Wed · 6:00 PM", when: "Wed, 06:00 PM" },
  { id: "s5", label: "Fri · 11:30 AM", when: "Fri, 11:30 AM" },
];

export function loadAppointments(): Appointment[] {
  return readJson(APPTS_KEY, [] as Appointment[]);
}

export function bookAppointment(slot: Slot, createdBy: "victim" | "counsellor"): Appointment[] {
  const list = loadAppointments();
  if (list.some((a) => a.slotId === slot.id && a.status === "booked")) return list;
  const next: Appointment = {
    id: `ap${Date.now()}`,
    caseId: "STH-221",
    alias: "Kavita (Alias)",
    when: slot.when,
    slotId: slot.id,
    status: "booked",
    createdBy,
  };
  const updated = [...list, next];
  writeJson(APPTS_KEY, updated);
  return updated;
}

export function openSlots(): Slot[] {
  const booked = new Set(
    loadAppointments()
      .filter((a) => a.status === "booked")
      .map((a) => a.slotId),
  );
  return availableSlots.filter((s) => !booked.has(s.id));
}

export function suggestTier(mood: number, sleep: CheckInResult["sleep"], safety: CheckInResult["safety"]): Tier {
  if (safety === "no" || mood <= 0) return "urgent";
  if (safety === "unsure" || mood <= 1 || sleep === "poor") return "priority";
  if (mood <= 2) return "review";
  return "routine";
}

export function loadTodayCheckIn(): CheckInResult | null {
  const raw = readJson<CheckInResult | null>(CHECKIN_KEY, null);
  if (!raw) return null;
  if (raw.date !== new Date().toDateString()) return null;
  return raw;
}

export function saveTodayCheckIn(result: Omit<CheckInResult, "date" | "suggestedTier">): CheckInResult {
  const { queued } = queueOfflineCheckIn({ ...result, source: "app" });
  return {
    date: queued.date,
    mood: queued.mood,
    sleep: queued.sleep,
    safety: queued.safety,
    note: queued.note,
    suggestedTier: queued.suggestedTier,
  };
}

export const counsellors = [
  "Asha Deshmukh",
  "Ravi Menon",
  "Priya Nair",
  "Sana Qureshi",
];

export function loadHandoffs(): HandoffRecord[] {
  return readJson(HANDOFF_KEY, [] as HandoffRecord[]);
}

export function addHandoff(input: Omit<HandoffRecord, "id" | "at">): HandoffRecord[] {
  const list = loadHandoffs();
  const next: HandoffRecord = {
    ...input,
    id: `ho${Date.now()}`,
    at: new Date().toLocaleString("en-IN"),
  };
  const updated = [next, ...list];
  writeJson(HANDOFF_KEY, updated);

  const meta = loadCaseMeta();
  meta[input.caseId] = { counsellor: input.toCounsellor };
  writeJson(CASES_META_KEY, meta);
  return updated;
}

export function loadCaseMeta(): Record<string, CaseMeta> {
  return readJson(CASES_META_KEY, {} as Record<string, CaseMeta>);
}

export function getCaseCounsellor(caseId: string, fallback: string): string {
  return loadCaseMeta()[caseId]?.counsellor ?? fallback;
}

/** Victim-facing legal/support stages for STH-221 */
export const victimCaseStages = [
  { id: "registered", title: "Case registered", detail: "Support opened via SAATHI", done: true },
  { id: "fir", title: "Complaint on record", detail: "Internal / formal complaint filed", done: true },
  { id: "support", title: "Counselling support", detail: "Regular check-ins with Asha", done: true },
  { id: "hearing", title: "Court hearing support", detail: "Accompaniment planned", done: false, current: true },
  { id: "followup", title: "Post-hearing follow-up", detail: "Safety and wellbeing review", done: false },
  { id: "rehab", title: "Ongoing support", detail: "Rehab / compensation help if needed", done: false },
];

export type TriageItem = {
  id: string;
  alias: string;
  tier: Tier;
  reason: string;
  score: number;
};

export function buildTriageQueue(
  cases: { id: string; alias: string; tier: Tier; lastCheckIn: string; note: string; stage: string }[],
): TriageItem[] {
  const checkIn = loadTodayCheckIn();
  const tierWeight: Record<Tier, number> = { urgent: 100, priority: 70, review: 40, routine: 10 };

  return cases
    .map((c) => {
      let score = tierWeight[c.tier];
      const reasons: string[] = [];
      if (c.tier === "urgent") reasons.push("Urgent tier");
      if (c.note.toLowerCase().includes("missed") || c.lastCheckIn.toLowerCase().includes("yesterday")) {
        score += 25;
        reasons.push("Missed / delayed check-in");
      }
      if (c.stage.toLowerCase().includes("court") || c.stage.toLowerCase().includes("hearing")) {
        score += 20;
        reasons.push("Upcoming court / hearing");
      }
      if (c.note.toLowerCase().includes("safety") || c.note.toLowerCase().includes("distress")) {
        score += 15;
        reasons.push(c.note);
      }
      if (c.id === "STH-221" && checkIn) {
        score += tierWeight[checkIn.suggestedTier] * 0.3;
        reasons.push(`Today's check-in → ${checkIn.suggestedTier}`);
      }
      if (reasons.length === 0) reasons.push(c.note || "Routine follow-up");
      return {
        id: c.id,
        alias: c.alias,
        tier: c.tier,
        reason: reasons.slice(0, 2).join(" · "),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/* ——— Features 6–12 store helpers ——— */

const NOTIF_KEY = "saathi_notifications";
const OFFLINE_KEY = "saathi_offline_queue";
const CAREGIVER_KEY = "saathi_caregiver_marks";
const IVRS_KEY = "saathi_ivrs_logs";
const ONLINE_KEY = "saathi_force_offline";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  kind: "checkin" | "hearing" | "session" | "crisis" | "system" | "caregiver";
  read: boolean;
  forRole: "victim" | "counsellor" | "caregiver" | "supervisor" | "all";
};

const defaultNotifs: AppNotification[] = [
  {
    id: "n1",
    title: "Missed check-in reminder",
    body: "STH-317 has not completed yesterday's check-in.",
    at: "Yesterday, 8:00 PM",
    kind: "checkin",
    read: false,
    forRole: "counsellor",
  },
  {
    id: "n2",
    title: "Court hearing tomorrow",
    body: "STH-221 — accompaniment call at 9:30 AM.",
    at: "Today, 7:00 AM",
    kind: "hearing",
    read: false,
    forRole: "all",
  },
  {
    id: "n3",
    title: "Session booked",
    body: "A slot may appear after victim booking — check Calendar.",
    at: "Today, 9:00 AM",
    kind: "session",
    read: true,
    forRole: "counsellor",
  },
  {
    id: "n4",
    title: "Gentle check-in nudge",
    body: "A short guided check-in helps Asha support you this week.",
    at: "Today, 8:00 AM",
    kind: "checkin",
    read: false,
    forRole: "victim",
  },
  {
    id: "n5",
    title: "Caregiver prompt",
    body: "You can confirm Kavita is safe today without opening case details.",
    at: "Today, 8:15 AM",
    kind: "caregiver",
    read: false,
    forRole: "caregiver",
  },
];

export function loadNotifications(): AppNotification[] {
  return readJson(NOTIF_KEY, defaultNotifs);
}

export function saveNotifications(list: AppNotification[]) {
  writeJson(NOTIF_KEY, list);
}

export function addNotification(
  n: Omit<AppNotification, "id" | "at" | "read"> & { read?: boolean },
): AppNotification[] {
  const list = loadNotifications();
  const next: AppNotification = {
    ...n,
    id: `n${Date.now()}`,
    at: new Date().toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
    read: n.read ?? false,
  };
  const updated = [next, ...list];
  saveNotifications(updated);
  return updated;
}

export function markNotificationRead(id: string): AppNotification[] {
  const updated = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsRead(
  role: AppNotification["forRole"],
): AppNotification[] {
  const updated = loadNotifications().map((n) =>
    n.forRole === role || n.forRole === "all" ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
  return updated;
}

export type OfflineCheckIn = CheckInResult & {
  id: string;
  synced: boolean;
  source: "app" | "ivrs" | "caregiver";
  queuedAt: string;
};

export function isForcedOffline(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONLINE_KEY) === "1";
}

export function setForcedOffline(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONLINE_KEY, v ? "1" : "0");
}

export function loadOfflineQueue(): OfflineCheckIn[] {
  return readJson(OFFLINE_KEY, [] as OfflineCheckIn[]);
}

export function queueOfflineCheckIn(
  result: Omit<CheckInResult, "date" | "suggestedTier"> & { source?: OfflineCheckIn["source"] },
): { queued: OfflineCheckIn; online: boolean } {
  const suggestedTier = suggestTier(result.mood, result.sleep, result.safety);
  const full: OfflineCheckIn = {
    ...result,
    date: new Date().toDateString(),
    suggestedTier,
    id: `off${Date.now()}`,
    synced: false,
    source: result.source ?? "app",
    queuedAt: new Date().toISOString(),
  };

  const online = typeof navigator !== "undefined" && navigator.onLine && !isForcedOffline();
  if (online) {
    writeJson(CHECKIN_KEY, {
      date: full.date,
      mood: full.mood,
      sleep: full.sleep,
      safety: full.safety,
      note: full.note,
      suggestedTier: full.suggestedTier,
    });
    full.synced = true;
    addNotification({
      title: "Check-in synced",
      body: `Mood ${full.mood + 1}/5 · Safety ${full.safety} · Tier ${full.suggestedTier}`,
      kind: "checkin",
      forRole: "counsellor",
    });
    if (full.safety === "no") {
      addNotification({
        title: "Crisis check-in flagged",
        body: "Victim reported feeling unsafe. Open crisis playbook.",
        kind: "crisis",
        forRole: "counsellor",
      });
    }
  } else {
    const q = loadOfflineQueue();
    writeJson(OFFLINE_KEY, [full, ...q]);
  }
  return { queued: full, online };
}

export function syncOfflineQueue(): OfflineCheckIn[] {
  const q = loadOfflineQueue();
  if (!q.length) return q;
  const latest = q[0]!;
  writeJson(CHECKIN_KEY, {
    date: latest.date,
    mood: latest.mood,
    sleep: latest.sleep,
    safety: latest.safety,
    note: latest.note,
    suggestedTier: latest.suggestedTier,
  });
  const synced = q.map((x) => ({ ...x, synced: true }));
  writeJson(OFFLINE_KEY, []);
  addNotification({
    title: "Offline check-ins synced",
    body: `${synced.length} queued check-in(s) uploaded.`,
    kind: "system",
    forRole: "all",
  });
  return synced;
}

export type CaregiverMark = {
  id: string;
  caseId: string;
  alias: string;
  safeToday: boolean;
  appointmentConfirmed: boolean;
  note: string;
  at: string;
};

export function loadCaregiverMarks(): CaregiverMark[] {
  return readJson(CAREGIVER_KEY, [] as CaregiverMark[]);
}

export function addCaregiverMark(
  input: Omit<CaregiverMark, "id" | "at">,
): CaregiverMark[] {
  const list = loadCaregiverMarks();
  const next: CaregiverMark = {
    ...input,
    id: `cg${Date.now()}`,
    at: new Date().toLocaleString("en-IN"),
  };
  const updated = [next, ...list];
  writeJson(CAREGIVER_KEY, updated);
  addNotification({
    title: input.safeToday ? "Caregiver: safe today" : "Caregiver: needs attention",
    body: `${input.alias} — caregiver mark recorded.`,
    kind: "caregiver",
    forRole: "counsellor",
  });
  return updated;
}

export type IvrsLog = {
  id: string;
  mood: number;
  sleep: CheckInResult["sleep"];
  safety: CheckInResult["safety"];
  at: string;
  suggestedTier: Tier;
};

export function loadIvrsLogs(): IvrsLog[] {
  return readJson(IVRS_KEY, [] as IvrsLog[]);
}

export function saveIvrsLog(input: {
  mood: number;
  sleep: CheckInResult["sleep"];
  safety: CheckInResult["safety"];
}): IvrsLog[] {
  const suggestedTier = suggestTier(input.mood, input.sleep, input.safety);
  const log: IvrsLog = {
    id: `iv${Date.now()}`,
    ...input,
    suggestedTier,
    at: new Date().toLocaleString("en-IN"),
  };
  const list = [log, ...loadIvrsLogs()];
  writeJson(IVRS_KEY, list);
  queueOfflineCheckIn({
    mood: input.mood,
    sleep: input.sleep,
    safety: input.safety,
    note: "IVRS voice check-in",
    source: "ivrs",
  });
  return list;
}
