export type StressLevel = 'calm' | 'mild' | 'moderate' | 'high';

export type VoiceBiomarkers = {
  pitchMean: number;        // Hz - fundamental frequency
  pitchVariability: number; // Hz - standard deviation of pitch
  energy: number;           // RMS energy 0-1
  speechRate: number;       // estimated syllables/sec
  pauseRatio: number;       // fraction of silence in recording
  jitter: number;           // pitch period variation 0-1
};

export type VoiceAnalysisResult = {
  stressLevel: StressLevel;
  stressScore: number;      // 0-100
  biomarkers: VoiceBiomarkers;
  confidence: number;       // 0-1
  insight: string;          // human-readable AI insight
};

export function calculateRMS(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const val = samples[i] ?? 0;
    sum += val * val;
  }
  return Math.sqrt(sum / samples.length);
}

export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
  const SIZE = samples.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = calculateRMS(samples);

  if (rms < 0.01) return null;

  let lastCorrelation = 1;
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      const s1 = samples[i] ?? 0;
      const s2 = samples[i + offset] ?? 0;
      correlation += Math.abs(s1 - s2);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    if (correlation > 0.9 && correlation > lastCorrelation) {
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.5 && bestOffset > 0) {
    const fundamentalFreq = sampleRate / bestOffset;
    if (fundamentalFreq >= 80 && fundamentalFreq <= 400) {
      return fundamentalFreq;
    }
  }

  return null;
}

export function analyzeAudioBuffer(audioBuffer: AudioBuffer): VoiceAnalysisResult {
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);

  const frameSize = Math.floor(sampleRate * 0.03); // 30ms frame
  const hopSize = Math.floor(sampleRate * 0.01);   // 10ms hop
  const numFrames = Math.floor((samples.length - frameSize) / hopSize);

  const pitches: number[] = [];
  const energies: number[] = [];
  let silentFrames = 0;

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = samples.subarray(start, start + frameSize);
    const rms = calculateRMS(frame);
    energies.push(rms);

    if (rms < 0.01) {
      silentFrames++;
    } else {
      const pitch = detectPitch(frame, sampleRate);
      if (pitch !== null) {
        pitches.push(pitch);
      }
    }
  }

  const energyMean = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;
  const pauseRatio = numFrames > 0 ? silentFrames / numFrames : 0;

  const pitchMean = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 180;
  
  let pitchVarianceSum = 0;
  for (const p of pitches) {
    pitchVarianceSum += Math.pow(p - pitchMean, 2);
  }
  const pitchVariability = pitches.length > 0 ? Math.sqrt(pitchVarianceSum / pitches.length) : 15;

  let jitterSum = 0;
  for (let i = 1; i < pitches.length; i++) {
    const p1 = pitches[i] ?? 0;
    const p0 = pitches[i - 1] ?? 0;
    jitterSum += Math.abs(p1 - p0);
  }
  const jitter = pitches.length > 1 ? (jitterSum / (pitches.length - 1)) / pitchMean : 0.02;

  const speechRate = Math.max(1.5, Math.min(6.5, (1 - pauseRatio) * 5 + (pitchVariability / 50)));

  // Calculate stress score (0 to 100)
  let score = 20; // baseline

  if (pitchVariability > 35) score += 25;
  else if (pitchVariability > 25) score += 15;

  if (jitter > 0.04) score += 25;
  else if (jitter > 0.025) score += 15;

  if (energyMean > 0.15 || energyMean < 0.02) score += 15;
  if (speechRate > 4.5 || speechRate < 2.0) score += 15;

  score = Math.min(100, Math.max(0, Math.round(score)));

  let stressLevel: StressLevel = 'calm';
  if (score >= 75) stressLevel = 'high';
  else if (score >= 50) stressLevel = 'moderate';
  else if (score >= 30) stressLevel = 'mild';

  let insight = "Voice pitch and speech cadence are within normal calm ranges.";
  if (stressLevel === 'high') {
    insight = "Elevated pitch variability, vocal jitter, and irregular pacing indicate high acute stress.";
  } else if (stressLevel === 'moderate') {
    insight = "Noticeable pitch fluctuations and vocal tension suggest moderate emotional strain.";
  } else if (stressLevel === 'mild') {
    insight = "Slight acoustic variations present; minor stress indicators detected.";
  }

  return {
    stressLevel,
    stressScore: score,
    biomarkers: {
      pitchMean: Math.round(pitchMean),
      pitchVariability: Math.round(pitchVariability * 10) / 10,
      energy: Math.round(energyMean * 100) / 100,
      speechRate: Math.round(speechRate * 10) / 10,
      pauseRatio: Math.round(pauseRatio * 100) / 100,
      jitter: Math.round(jitter * 1000) / 1000,
    },
    confidence: audioBuffer.duration > 3 ? 0.88 : 0.65,
    insight,
  };
}

export function getStressColor(level: StressLevel): string {
  switch (level) {
    case 'calm': return 'oklch(0.65 0.15 155)';
    case 'mild': return 'oklch(0.65 0.12 245)';
    case 'moderate': return 'oklch(0.75 0.15 70)';
    case 'high': return 'oklch(0.65 0.2 25)';
  }
}

export function getStressLabel(level: StressLevel): string {
  switch (level) {
    case 'calm': return 'Calm';
    case 'mild': return 'Mild Tension';
    case 'moderate': return 'Moderate Stress';
    case 'high': return 'High Stress';
  }
}
