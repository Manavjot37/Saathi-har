export type DistressLevel = 'low' | 'moderate' | 'high' | 'crisis';
export type Emotion = 'neutral' | 'sadness' | 'anxiety' | 'anger' | 'fear' | 'hopelessness' | 'numbness';

export type DistressAnalysis = {
  level: DistressLevel;
  score: number;           // 0-100
  dominantEmotion: Emotion;
  confidence: number;      // 0-1
  crisisFlag: boolean;     // true if crisis language detected
  triggers: string[];      // which patterns matched (for counsellor transparency)
};

// Define keyword categories and associated emotions/scores
const KEYWORDS = {
  crisis: {
    baseScore: 90,
    phrases: [
      'end it all', 'can\'t go on', 'no way out', 'want to die', 'kill myself', 'suicide', 'end my life', 'better off dead', 'no reason to live',
      'he will kill', 'going to hurt me', 'he has a weapon', 'locked in', 'can\'t escape', 'help me please', 'i am trapped',
      'मर जाना चाहती हूं', 'जीना नहीं चाहती', 'मदद करो'
    ]
  },
  high: {
    baseScore: 60,
    categories: {
      hopelessness: ['hopeless', 'worthless', 'empty', 'pointless', 'give up', 'broken', 'alone', 'nobody cares', 'burden', 'बेबस', 'अकेली'],
      numbness: ['can\'t feel anything', 'numb'],
      anxiety: ['terrified', 'panic', 'can\'t breathe', 'heart racing', 'shaking', 'can\'t sleep', 'nightmares', 'flashbacks', 'डर लगता है'],
      fear: ['hit me', 'beat me', 'threatened', 'forced', 'scared of him', 'won\'t let me leave', 'मारता है'],
      sadness: ['रोना आता है']
    }
  },
  moderate: {
    baseScore: 30,
    categories: {
      anxiety: ['worried', 'anxious', 'scared', 'nervous', 'stressed', 'overwhelmed', 'confused', 'चिंता', 'परेशान', 'डर'],
      sadness: ['sad', 'crying', 'lonely', 'miss', 'struggling', 'difficult', 'hard day', 'not okay', 'थक गई', 'उदास'],
      numbness: ['tired', 'exhausted']
    }
  },
  low: {
    baseScore: 0,
    categories: {
      neutral: ['better', 'okay', 'good', 'calm', 'safe', 'grateful', 'hopeful', 'improving', 'breathing helped', 'feeling stronger', 'ठीक हूं', 'अच्छा लग रहा', 'बेहतर']
    }
  }
};

export function analyzeText(text: string): DistressAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      level: 'low',
      score: 0,
      dominantEmotion: 'neutral',
      confidence: 0,
      crisisFlag: false,
      triggers: []
    };
  }

  const lowerText = text.toLowerCase();
  const triggers: string[] = [];
  let baseScore = 0;
  let crisisFlag = false;
  
  const emotionCounts: Record<Emotion, number> = {
    neutral: 0,
    sadness: 0,
    anxiety: 0,
    anger: 0,
    fear: 0,
    hopelessness: 0,
    numbness: 0
  };

  // 1. Scan Crisis keywords
  for (const phrase of KEYWORDS.crisis.phrases) {
    if (lowerText.includes(phrase)) {
      triggers.push(phrase);
      crisisFlag = true;
      baseScore = Math.max(baseScore, KEYWORDS.crisis.baseScore);
      
      // Determine emotion context based on text
      if (['he will kill', 'going to hurt me', 'he has a weapon', 'locked in', 'can\'t escape', 'help me please', 'i am trapped', 'मदद करो'].includes(phrase)) {
        emotionCounts.fear += 2;
      } else {
        emotionCounts.hopelessness += 2;
      }
    }
  }

  // 2. Scan High keywords
  for (const [emotion, phrases] of Object.entries(KEYWORDS.high.categories)) {
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        triggers.push(phrase);
        baseScore = Math.max(baseScore, KEYWORDS.high.baseScore);
        emotionCounts[emotion as Emotion] += 1.5;
      }
    }
  }

  // 3. Scan Moderate keywords
  for (const [emotion, phrases] of Object.entries(KEYWORDS.moderate.categories)) {
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        triggers.push(phrase);
        baseScore = Math.max(baseScore, KEYWORDS.moderate.baseScore);
        emotionCounts[emotion as Emotion] += 1;
      }
    }
  }

  // 4. Scan Low keywords
  for (const [emotion, phrases] of Object.entries(KEYWORDS.low.categories)) {
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        triggers.push(phrase);
        emotionCounts[emotion as Emotion] += 1;
      }
    }
  }

  // Multipliers
  let multiplierScore = 0;
  
  // All Caps check (words > 3 letters)
  const allCapsRegex = /\b[A-Z]{3,}\b/g;
  const capsMatches = text.match(allCapsRegex);
  if (capsMatches && capsMatches.length > 0) {
    multiplierScore += 10;
  }

  // Exclamation marks
  const exclamationMatches = text.match(/!{2,}/g);
  if (exclamationMatches && exclamationMatches.length > 0) {
    multiplierScore += 5;
  }
  
  // Repeated phrases/words check
  const words = text.toLowerCase().split(/\s+/);
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const hasRepetition = Object.values(wordCounts).some(count => count >= 3);
  if (hasRepetition) {
    multiplierScore += 5;
  }

  let finalScore = baseScore + multiplierScore;
  if (triggers.length === 0 && finalScore === 0) {
     finalScore = 5; // base floor if text provided but no matches
  }

  finalScore = Math.min(100, Math.max(0, finalScore));

  // Determine Level
  let level: DistressLevel = 'low';
  if (crisisFlag || finalScore >= 90) {
    level = 'crisis';
  } else if (finalScore >= 60) {
    level = 'high';
  } else if (finalScore >= 30) {
    level = 'moderate';
  }

  // Determine dominant emotion
  let dominantEmotion: Emotion = 'neutral';
  let maxCount = -1;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion as Emotion;
    }
  }
  
  // Default fallback
  if (maxCount === 0 && finalScore > 0) {
    dominantEmotion = 'neutral';
  }

  // Calculate confidence
  const lengthFactor = Math.min(1, text.length / 100); 
  const triggersFactor = Math.min(1, triggers.length / 3); 
  let confidence = (lengthFactor * 0.4) + (triggersFactor * 0.6);
  
  if (triggers.length === 0) {
    confidence = 0.2; 
  }

  return {
    level,
    score: finalScore,
    dominantEmotion,
    confidence: Number(confidence.toFixed(2)),
    crisisFlag,
    triggers: Array.from(new Set(triggers)) // deduplicate
  };
}

export function getDistressColor(level: DistressLevel): string {
  switch (level) {
    case 'crisis':
      return 'var(--urgent)';
    case 'high':
      return 'var(--priority)';
    case 'moderate':
      return 'var(--review)';
    case 'low':
      return 'var(--routine)';
    default:
      return 'var(--brand)';
  }
}

export function getDistressLabel(level: DistressLevel): string {
  switch (level) {
    case 'crisis':
      return 'Crisis Alert';
    case 'high':
      return 'High Distress';
    case 'moderate':
      return 'Moderate Distress';
    case 'low':
      return 'Routine / Low';
    default:
      return 'Unknown';
  }
}
