const WELLNESS_KEY = "saathi_wellness_history";

export type WellnessSignal = {
  source: 'checkin' | 'nlp' | 'voice' | 'behavioral';
  score: number;  // 0-100 (100 = best wellness)
  weight: number; // 0-1
  timestamp: string;
};

export type WellnessResult = {
  overallScore: number;  // 0-100
  trend: 'improving' | 'stable' | 'declining';
  signals: WellnessSignal[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  insight: string;
  autoEscalate: boolean;
  date: string;
};

export function checkInToWellnessSignal(mood: number, sleep: string, safety: string): WellnessSignal {
  let score = 0;
  score += (mood / 4) * 40; // 0-40
  if (sleep === 'good') score += 30;
  else if (sleep === 'ok') score += 15;

  if (safety === 'yes') score += 30;
  else if (safety === 'unsure') score += 10;

  return {
    source: 'checkin',
    score: Math.min(100, Math.max(0, Math.round(score))),
    weight: 0.3,
    timestamp: new Date().toISOString(),
  };
}

export function nlpToWellnessSignal(distressScore: number): WellnessSignal {
  return {
    source: 'nlp',
    score: Math.max(0, 100 - distressScore),
    weight: 0.35,
    timestamp: new Date().toISOString(),
  };
}

export function voiceToWellnessSignal(stressScore: number): WellnessSignal {
  return {
    source: 'voice',
    score: Math.max(0, 100 - stressScore),
    weight: 0.35,
    timestamp: new Date().toISOString(),
  };
}

export function computeTrend(history: number[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';
  const recent = history.slice(-3);
  const first = recent[0] ?? 50;
  const last = recent[recent.length - 1] ?? 50;
  const diff = last - first;

  if (diff >= 8) return 'improving';
  if (diff <= -8) return 'declining';
  return 'stable';
}

export function computeWellnessScore(signals: WellnessSignal[], pastHistory: number[] = []): WellnessResult {
  if (signals.length === 0) {
    return {
      overallScore: 75,
      trend: 'stable',
      signals: [],
      riskLevel: 'low',
      insight: 'No signals recorded yet today. Standard baseline active.',
      autoEscalate: false,
      date: new Date().toDateString(),
    };
  }

  let totalWeight = 0;
  let weightedScore = 0;

  for (const s of signals) {
    weightedScore += s.score * s.weight;
    totalWeight += s.weight;
  }

  const overallScore = Math.round(weightedScore / (totalWeight || 1));
  const trend = computeTrend([...pastHistory, overallScore]);

  let riskLevel: WellnessResult['riskLevel'] = 'low';
  if (overallScore <= 30) riskLevel = 'critical';
  else if (overallScore <= 50) riskLevel = 'high';
  else if (overallScore <= 70) riskLevel = 'moderate';

  const autoEscalate = riskLevel === 'critical' || signals.some(s => s.score < 20);

  let insight = "User signals show stable emotional resilience.";
  if (riskLevel === 'critical') {
    insight = "Critical distress detected across multiple signals. Immediate outreach recommended.";
  } else if (riskLevel === 'high') {
    insight = "Elevated distress markers detected in recent text/voice check-ins.";
  } else if (riskLevel === 'moderate') {
    insight = "Mild fluctuations noted in overall wellness score.";
  }

  return {
    overallScore,
    trend,
    signals,
    riskLevel,
    insight,
    autoEscalate,
    date: new Date().toDateString(),
  };
}

export function loadWellnessHistory(): WellnessResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WELLNESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWellnessResult(result: WellnessResult): WellnessResult[] {
  if (typeof window === "undefined") return [];
  const list = loadWellnessHistory();
  const filtered = list.filter(item => item.date !== result.date);
  const updated = [result, ...filtered].slice(0, 30);
  window.localStorage.setItem(WELLNESS_KEY, JSON.stringify(updated));
  return updated;
}

export function getLatestWellness(): WellnessResult | null {
  const history = loadWellnessHistory();
  return history[0] ?? null;
}

export function getWellnessColor(score: number): string {
  if (score <= 35) return 'var(--urgent)';
  if (score <= 60) return 'var(--priority)';
  if (score <= 75) return 'var(--review)';
  return 'var(--routine)';
}

export function getWellnessLabel(score: number): string {
  if (score <= 35) return 'Critical Distress';
  if (score <= 60) return 'High Attention';
  if (score <= 75) return 'Moderate Wellbeing';
  return 'Good Wellbeing';
}
