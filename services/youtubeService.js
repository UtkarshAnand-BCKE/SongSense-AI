const { fetchWithRetry } = require("./fetchWithRetry");

// Searches YouTube for the best-matching official/lyric video for a track
// and returns everything needed to embed a real player. Only needs a free
// API key (no OAuth, no premium/subscription requirement).
async function findTrack(title, artist) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("YOUTUBE_API_KEY is not configured in .env");
      return null;
    }

    const query = encodeURIComponent(`${title} ${artist} official audio`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoCategoryId=10&maxResults=1&key=${apiKey}`;

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      const body = await response.text();
      console.error(`YouTube search failed. Status: ${response.status}. Body: ${body}`);
      return null;
    }

    const data = await response.json();
    const item = data.items && data.items[0];

    if (!item) {
      console.warn(`No YouTube match found for "${title}" by "${artist}"`);
      return null;
    }

    const videoId = item.id.videoId;
    console.log(`YouTube match found: ${item.snippet.title} — ${videoId}`);

    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoTitle: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url
    };
  } catch (err) {
    console.error("YouTube lookup failed:", err.message);
    return null;
  }
}

module.exports = { findTrack };
