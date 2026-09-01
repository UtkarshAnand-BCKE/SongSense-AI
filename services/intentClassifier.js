// services/intentClassifier.js

// Keyword map: intent -> trigger words/phrases a user might type
const INTENT_KEYWORDS = {
  happy: ["happy", "joy", "good mood", "excited", "great day", "celebrate", "cheerful"],
  sad: ["sad", "down", "depressed", "low", "unhappy", "blue", "upset"],
  romantic: ["romantic", "love", "crush", "date", "valentine", "my partner", "girlfriend", "boyfriend"],
  heartbreak: ["breakup", "broken heart", "ex", "miss him", "miss her", "heartbroken", "moving on"],
  energetic: ["energetic", "pumped", "workout", "gym", "hype", "party", "dance"],
  calm: ["calm", "relax", "chill", "peaceful", "unwind", "rest", "quiet"],
  nostalgic: ["nostalgic", "old memories", "throwback", "childhood", "miss the old days"],
  motivational: ["motivate", "motivation", "inspire", "focus", "grind", "productive"],
  rainy: ["rain", "raining", "monsoon", "drizzle"],
};

/**
 * Classifies free-text user input into a mood/intent category.
 * @param {string} text - Raw user input (e.g. "I'm feeling kinda low today")
 * @returns {{ intent: string, confidence: number, matchedKeyword: string|null }}
 */
function classifyIntent(text) {
  if (!text || typeof text !== "string") {
    return { intent: "neutral", confidence: 0, matchedKeyword: null };
  }

  const lower = text.toLowerCase();
  let bestIntent = "neutral";
  let bestScore = 0;
  let matchedKeyword = null;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // Longer keyword matches = more specific = higher confidence
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intent;
          matchedKeyword = kw;
        }
      }
    }
  }

  const confidence = bestScore > 0 ? Math.min(1, bestScore / 20) : 0;

  return { intent: bestIntent, confidence, matchedKeyword };
}

function getSupportedIntents() {
  return Object.keys(INTENT_KEYWORDS);
}

module.exports = {
  classifyIntent,
  getSupportedIntents,
};