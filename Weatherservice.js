const WEATHER_CODES = {
  0: ["clear", "Clear sky"],
  1: ["clear", "Mainly clear"],
  2: ["clouds", "Partly cloudy"],
  3: ["clouds", "Overcast"],
  45: ["mist", "Foggy"],
  48: ["mist", "Rime fog"],
  51: ["drizzle", "Light drizzle"],
  53: ["drizzle", "Drizzle"],
  55: ["drizzle", "Heavy drizzle"],
  61: ["rain", "Light rain"],
  63: ["rain", "Rain"],
  65: ["rain", "Heavy rain"],
  71: ["snow", "Light snow"],
  73: ["snow", "Snow"],
  75: ["snow", "Heavy snow"],
  80: ["rain", "Rain showers"],
  81: ["rain", "Rain showers"],
  82: ["rain", "Heavy rain showers"],
  95: ["storm", "Thunderstorm"],
  96: ["storm", "Thunderstorm with hail"],
  99: ["storm", "Thunderstorm with hail"]
};

function weatherCodeToCondition(code) {
  const [condition, description] = WEATHER_CODES[code] || ["unknown", "Unusual weather"];
  return { condition, description };
}

function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

async function geocodeCity(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not search for that city.");
  }

  const data = await response.json();
  const result = data.results && data.results[0];
  if (!result) {
    throw new Error(`No matching city found for "${city}".`);
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: [result.name, result.admin1, result.country].filter(Boolean).join(", "),
    source: "city-search"
  };
}

// FIX: previously always returned null, making weather.city always null in the UI.
// Now returns a readable coordinate string as a fallback city label.
async function reverseGeocode(latitude, longitude) {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", `${latitude},${longitude}`);
    url.searchParams.set("count", "1");
    const response = await fetch(url);
    if (!response.ok) return `${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)}`;
    const data = await response.json();
    const result = data.results && data.results[0];
    if (result) {
      return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    }
    return `${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)}`;
  } catch {
    return `${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)}`;
  }
}

async function getWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load current weather.");
  }

  const data = await response.json();
  const current = data.current || {};
  const codeInfo = weatherCodeToCondition(current.weather_code);
  const time = current.time ? new Date(current.time) : new Date();
  const city = await reverseGeocode(latitude, longitude);

  return {
    city,
    condition: codeInfo.condition,
    description: codeInfo.description,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    timeOfDay: getTimeOfDay(time),
    observedAt: current.time,
    timezone: data.timezone
  };
}

module.exports = {
  getWeather,
  geocodeCity
};