const express = require("express");
const path = require("path");

const { classifyIntent } = require("./services/intentClassifier");
const { recommendSongs } = require("./services/songRecommender");
const { getWeather, geocodeCity } = require("./services/weatherService");

const app = express();
const PORT = 3000;

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

    res.json({
      intent: prediction.intent,
      weather,
      song: recommendation.primary,
      playlist: recommendation.playlist
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