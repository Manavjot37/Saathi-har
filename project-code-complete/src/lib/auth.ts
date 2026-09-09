export type Role = "counsellor" | "victim" | "caregiver" | "supervisor";

export type Session = {
  role: Role;
  name: string;
  id: string;
};

const KEY = "saathi-session";

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export const roleHome: Record<Role, "/counsellor" | "/victim" | "/caregiver" | "/supervisor"> = {
  counsellor: "/counsellor",
  victim: "/victim",
  caregiver: "/caregiver",
  supervisor: "/supervisor",
};

export const roleDisplay: Record<Role, { name: string; id: string; label: string }> = {
  counsellor: { name: "Asha Verma", id: "CNS-018", label: "Counsellor" },
  victim: { name: "Kavita (Alias)", id: "STH-221", label: "Victim" },
  caregiver: { name: "Meera (Caregiver)", id: "CG-014", label: "Caregiver" },
  supervisor: { name: "Dr. Naina Rao", id: "SUP-003", label: "Supervisor" },
};
