const songs = require("../data/songs.json");

const moodKeywords = {
  sad: ["sad", "low", "cry", "heartbreak", "alone", "miss", "emotional"],
  happy: ["happy", "good", "bright", "smile", "fresh", "positive"],
  calm: ["calm", "chill", "relax", "peace", "soft", "lofi", "rainy"],
  energetic: ["energy", "energetic", "dance", "party", "gym", "workout", "hype"],
  romantic: ["love", "romantic", "date", "crush", "valentine"],
  focus: ["study", "coding", "work", "focus", "read", "concentration"]
};

function extractMoods(message) {
  const input = String(message).toLowerCase();
  return Object.entries(moodKeywords)
    .filter(([, words]) => words.some((word) => input.includes(word)))
    .map(([mood]) => mood);
}

function temperatureMood(temp) {
  if (typeof temp !== "number") return null;
  if (temp <= 10) return "cozy";
  if (temp >= 30) return "bright";
  return "balanced";
}

function hasOverlap(a = [], b = []) {
  return a.some((item) => b.includes(item));
}

function recommendSongs({
  message,
  intent,
  weather,
  coordinates,
  favoriteIds = [],
  dislikedIds = [],
  limit = 5
}) {
  const moods = extractMoods(message);
  const tempMood = temperatureMood(weather.temperature);
  const weatherCondition = weather.condition;
  const timeOfDay = weather.timeOfDay;
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  const hindiSongs = songs.filter((song) => song.language === "Hindi");

  const scored = hindiSongs.map((song) => {
    let score = 0;
    const reasons = [];

    if (song.intents.includes(intent)) {
      score += 35;
      reasons.push(`matches your ${intent.replace(/_/g, " ")} request`);
    }

    if (song.weather.includes(weatherCondition)) {
      score += 25;
      reasons.push(`fits ${weather.description.toLowerCase()}`);
    }

    if (hasOverlap(song.moods, moods)) {
      score += 20;
      reasons.push(`captures the ${moods.join(", ")} mood`);
    }

    if (song.timeOfDay.includes(timeOfDay)) {
      score += 8;
      reasons.push(`works well for ${timeOfDay}`);
    }

    if (tempMood && song.temperatureTags.includes(tempMood)) {
      score += 6;
      reasons.push(`suits the ${tempMood} temperature`);
    }

    if (favoriteIds.includes(song.id)) {
      score += 5;
      reasons.push("similar to songs you favorited");
    }

    if (dislikedIds.includes(song.id)) {
      score -= 30;
    }

    score += song.popularity / 20;

    return {
      ...song,
      score: Number(score.toFixed(2)),
      reasons: reasons.slice(0, 3),
      searchUrl: `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`,
      context: {
        weather: weatherCondition,
        timeOfDay,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      }
    };
  });

  const results = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((song, index) => ({
      rank: index + 1,
      id: song.id,
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      score: song.score,
      reasons: song.reasons.length ? song.reasons : ["a flexible match for your current context"],
      searchUrl: song.searchUrl,
      context: song.context
    }));

  return {
    primary: results[0],
    playlist: results,
    detectedMoods: moods,
    temperatureTag: tempMood
  };
}

module.exports = {
  recommendSongs
};