import type { Lang } from "@/lib/i18n";
import type { Tier } from "@/lib/mock-data";

export type LangResource = {
  id: string;
  title: string;
  detail: string;
  category: "exercise" | "legal" | "helpline" | "wellbeing";
  langs: Lang[];
};

export const languageResources: LangResource[] = [
  {
    id: "r1",
    title: "Box breathing (audio guide)",
    detail: "4-minute calm breathing you can play anytime.",
    category: "exercise",
    langs: ["en", "hi", "mr", "bn"],
  },
  {
    id: "r2",
    title: "Women's Helpline 181 card",
    detail: "When to call, what to say, and how to stay safe after.",
    category: "helpline",
    langs: ["en", "hi", "bn", "gu", "pa", "ur"],
  },
  {
    id: "r3",
    title: "Free legal aid — how to apply",
    detail: "District legal services authority steps and documents.",
    category: "legal",
    langs: ["en", "hi", "ta", "te", "kn", "ml", "or"],
  },
  {
    id: "r4",
    title: "Sleep wind-down routine",
    detail: "10-minute evening routine after a hard check-in day.",
    category: "wellbeing",
    langs: ["en", "hi", "mr", "gu", "pa"],
  },
  {
    id: "r5",
    title: "Court day preparation sheet",
    detail: "What to pack, who to inform, and how to ask for accompaniment.",
    category: "legal",
    langs: ["en", "hi", "ta", "te", "bn", "ur"],
  },
  {
    id: "r6",
    title: "Grounding 5-4-3-2-1",
    detail: "Sensory grounding script in your language.",
    category: "exercise",
    langs: ["en", "hi", "ta", "ml", "kn", "te", "or"],
  },
  {
    id: "r7",
    title: "Cyber harassment first steps",
    detail: "Evidence checklist and cyber cell contacts.",
    category: "legal",
    langs: ["en", "hi", "bn", "te", "ta"],
  },
  {
    id: "r8",
    title: "Caregiver support note",
    detail: "How to support without taking over decisions.",
    category: "wellbeing",
    langs: ["en", "hi", "mr", "gu", "pa", "ur"],
  },
];

export type PeerGroup = {
  id: string;
  name: string;
  city: string;
  language: string;
  lang: Lang;
  focus: string;
  meets: string;
  contact: string;
};

export const peerGroups: PeerGroup[] = [
  {
    id: "pg1",
    name: "Sakhi Circle — Hindi",
    city: "Nagpur",
    language: "Hindi",
    lang: "hi",
    focus: "Workplace harassment survivors",
    meets: "Saturdays, 5 PM (in-person)",
    contact: "Via Counsellor Asha",
  },
  {
    id: "pg2",
    name: "Neelam Peer Group",
    city: "Pune",
    language: "Marathi",
    lang: "mr",
    focus: "Domestic violence recovery",
    meets: "Wednesdays, 6 PM (hybrid)",
    contact: "District women's desk",
  },
  {
    id: "pg3",
    name: "Asha Vani",
    city: "Hyderabad",
    language: "Telugu",
    lang: "te",
    focus: "Court accompaniment peers",
    meets: "Alternate Sundays",
    contact: "NGO Saheli desk",
  },
  {
    id: "pg4",
    name: "Nilavu Circle",
    city: "Chennai",
    language: "Tamil",
    lang: "ta",
    focus: "Trauma-informed peer listening",
    meets: "Fridays, 4 PM",
    contact: "Via SAATHI resources",
  },
  {
    id: "pg5",
    name: "Umeed Baithak",
    city: "Lucknow",
    language: "Urdu / Hindi",
    lang: "ur",
    focus: "Family & community support",
    meets: "Thursdays, 11 AM",
    contact: "Women's shelter liaison",
  },
  {
    id: "pg6",
    name: "Shanti Group",
    city: "Ahmedabad",
    language: "Gujarati",
    lang: "gu",
    focus: "Livelihood & rehab peers",
    meets: "Monthly, 1st Sunday",
    contact: "Vocational mentor cell",
  },
  {
    id: "pg7",
    name: "Bengal Bondhu",
    city: "Kolkata",
    language: "Bengali",
    lang: "bn",
    focus: "Young adult survivors",
    meets: "Online, Sundays 7 PM",
    contact: "College helpline bridge",
  },
  {
    id: "pg8",
    name: "Punjabi Saheliyan",
    city: "Amritsar",
    language: "Punjabi",
    lang: "pa",
    focus: "Safety planning peers",
    meets: "Tuesdays, 5:30 PM",
    contact: "District counsellor desk",
  },
];

/** 14-day wellbeing series for counsellor view (STH-221) */
export const moodHistory14 = [
  { day: "Aug 25", score: 3.4, chat: 0 },
  { day: "Aug 26", score: 3.2, chat: 1 },
  { day: "Aug 27", score: 3.1, chat: 0 },
  { day: "Aug 28", score: 2.9, chat: 2 },
  { day: "Aug 29", score: 2.8, chat: 1 },
  { day: "Aug 30", score: 3.0, chat: 0 },
  { day: "Aug 31", score: 2.7, chat: 3 },
  { day: "Sep 1", score: 2.6, chat: 2 },
  { day: "Sep 2", score: 2.8, chat: 1 },
  { day: "Sep 3", score: 2.5, chat: 4 },
  { day: "Sep 4", score: 2.6, chat: 1 },
  { day: "Sep 5", score: 2.9, chat: 0 },
  { day: "Sep 6", score: 2.7, chat: 2 },
  { day: "Today", score: 2.6, chat: 1 },
];

export type SupervisorCounsellor = {
  name: string;
  caseload: number;
  urgent: number;
  avgResponseHrs: number;
  handoffsIn: number;
  handoffsOut: number;
  checkInRate: number;
  rating: number;
  satisfactionRate: number;
  reviewsCount: number;
};

export const supervisorTeam: SupervisorCounsellor[] = [
  { name: "Asha Deshmukh", caseload: 18, urgent: 2, avgResponseHrs: 1.4, handoffsIn: 1, handoffsOut: 0, checkInRate: 86, rating: 4.9, satisfactionRate: 98, reviewsCount: 42 },
  { name: "Ravi Menon", caseload: 15, urgent: 1, avgResponseHrs: 2.1, handoffsIn: 0, handoffsOut: 1, checkInRate: 78, rating: 4.7, satisfactionRate: 94, reviewsCount: 38 },
  { name: "Priya Nair", caseload: 12, urgent: 0, avgResponseHrs: 1.1, handoffsIn: 2, handoffsOut: 0, checkInRate: 91, rating: 4.9, satisfactionRate: 99, reviewsCount: 50 },
  { name: "Sana Qureshi", caseload: 14, urgent: 1, avgResponseHrs: 1.8, handoffsIn: 0, handoffsOut: 1, checkInRate: 82, rating: 4.8, satisfactionRate: 96, reviewsCount: 31 },
];

export const supervisorHeat: { district: string; urgent: number; priority: number; review: number; routine: number }[] = [
  { district: "Nagpur", urgent: 2, priority: 5, review: 8, routine: 18 },
  { district: "Pune", urgent: 3, priority: 4, review: 6, routine: 22 },
  { district: "Bhopal", urgent: 1, priority: 3, review: 7, routine: 14 },
  { district: "Indore", urgent: 0, priority: 2, review: 5, routine: 16 },
  { district: "Hyderabad", urgent: 1, priority: 4, review: 4, routine: 12 },
];

export const crisisSteps = [
  {
    id: "c1",
    title: "Call emergency if in immediate danger",
    detail: "112 (National Emergency) or 181 (Women's Helpline).",
    action: "call",
    href: "tel:112",
  },
  {
    id: "c2",
    title: "Send silent alert to counsellor",
    detail: "Discreet flag — Asha is notified without a phone ring.",
    action: "silent",
  },
  {
    id: "c3",
    title: "Open your safety plan",
    detail: "Code word, safe place, and trusted contacts.",
    action: "plan",
  },
  {
    id: "c4",
    title: "Stay with SAATHI chat if safe",
    detail: "Message your counsellor; keep location private unless you choose.",
    action: "chat",
  },
];

export type IvrsScriptStep = {
  prompt: string;
  options: { key: string; label: string; value: string }[];
};

export const ivrsScript: IvrsScriptStep[] = [
  {
    prompt: "Welcome to SAATHI IVRS. Press for mood today.",
    options: [
      { key: "1", label: "Very low", value: "0" },
      { key: "2", label: "Low", value: "1" },
      { key: "3", label: "Okay", value: "2" },
      { key: "4", label: "Good", value: "3" },
      { key: "5", label: "Strong", value: "4" },
    ],
  },
  {
    prompt: "How was your sleep last night?",
    options: [
      { key: "1", label: "Poor", value: "poor" },
      { key: "2", label: "Okay", value: "ok" },
      { key: "3", label: "Good", value: "good" },
    ],
  },
  {
    prompt: "Do you feel safe where you are today?",
    options: [
      { key: "1", label: "Yes", value: "yes" },
      { key: "2", label: "Not sure", value: "unsure" },
      { key: "3", label: "No", value: "no" },
    ],
  },
];

export function resourcesForLang(lang: Lang): LangResource[] {
  return languageResources.filter((r) => r.langs.includes(lang) || r.langs.includes("en"));
}

export function peersForLang(lang: Lang): PeerGroup[] {
  const exact = peerGroups.filter((p) => p.lang === lang);
  return exact.length ? exact : peerGroups.filter((p) => p.lang === "hi" || p.lang === "en");
}

export type TierCounts = Record<Tier, number>;
