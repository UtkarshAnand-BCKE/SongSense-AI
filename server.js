require("dotenv").config();

// Some Windows/VPN setups resolve IPv6 first and time out before falling
// back to IPv4. Forcing IPv4 first avoids the ConnectTimeoutError some
// users hit when calling external APIs.
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const path = require("path");

const { classifyIntent } = require("./services/intentClassifier");
const { recommendSongs } = require("./services/songRecommender");
const { getWeather, geocodeCity } = require("./services/weatherService");
const { findTrack } = require("./services/youtubeService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/geocode", async (req, res) => {
  try {
    const city = req.query.city;
    const result = await geocodeCity(city);

    res.json({
      lat: result.latitude,
      lon: result.longitude,
      name: result.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/recommend", async (req, res) => {
  try {
    console.log(req.body);

    const { message, latitude, longitude } = req.body;

    const weather = await getWeather(latitude, longitude);

    const prediction = classifyIntent(message);

    const recommendation = recommendSongs({
      message,
      intent: prediction.intent,
      weather,
      coordinates: { latitude, longitude }
    });

    // Look up a real, playable YouTube video for the top recommendation.
    // Falls back to null if no match or if the API key isn't configured.
    let media = null;
    if (recommendation.primary) {
      media = await findTrack(recommendation.primary.title, recommendation.primary.artist);
    }

    res.json({
      intent: prediction.intent,
      weather,
      song: recommendation.primary,
      playlist: recommendation.playlist,
      media
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
