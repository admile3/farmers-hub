const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

function dateDiffInDays(dateString) {
  const today = new Date();
  const target = new Date(`${dateString}T12:00:00`);

  today.setHours(12, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getDailyValue(weather, key, index) {
  return weather?.daily?.[key]?.[index] ?? null;
}

export async function getMarketWeatherForecast(zipCode, marketDate) {
  if (!zipCode || !marketDate) {
    return {
      available: false,
      message: "Enter a zip code and market date to check the forecast."
    };
  }

  const daysOut = dateDiffInDays(marketDate);

  if (daysOut < 0) {
    return {
      available: false,
      message: "Forecast is only available for today or upcoming dates."
    };
  }

  if (daysOut > 15) {
    return {
      available: false,
      message: "Forecast data is only available for nearby dates. Refresh weather closer to market day."
    };
  }

  const geoUrl = new URL(GEOCODING_URL);
  geoUrl.searchParams.set("name", zipCode);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");
  geoUrl.searchParams.set("countryCode", "US");

  const geoResponse = await fetch(geoUrl.toString());

  if (!geoResponse.ok) {
    throw new Error("Could not look up that zip code.");
  }

  const geoData = await geoResponse.json();
  const location = geoData?.results?.[0];

  if (!location) {
    return {
      available: false,
      message: "Could not find a weather location for that zip code."
    };
  }

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.searchParams.set("latitude", location.latitude);
  forecastUrl.searchParams.set("longitude", location.longitude);
  forecastUrl.searchParams.set("temperature_unit", "fahrenheit");
  forecastUrl.searchParams.set("wind_speed_unit", "mph");
  forecastUrl.searchParams.set("precipitation_unit", "inch");
  forecastUrl.searchParams.set("timezone", "auto");
  forecastUrl.searchParams.set("forecast_days", "16");
  forecastUrl.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max"
    ].join(",")
  );
  forecastUrl.searchParams.set(
    "hourly",
    ["relative_humidity_2m"].join(",")
  );

  const forecastResponse = await fetch(forecastUrl.toString());

  if (!forecastResponse.ok) {
    throw new Error("Could not load weather forecast.");
  }

  const weather = await forecastResponse.json();
  const dateIndex = weather?.daily?.time?.findIndex((date) => date === marketDate);

  if (dateIndex < 0) {
    return {
      available: false,
      message: "Forecast data is not available for that date yet."
    };
  }

  const hourlyHumidity = weather?.hourly?.relative_humidity_2m || [];
  const hourlyTimes = weather?.hourly?.time || [];
  const matchingHumidity = hourlyHumidity.filter((_, index) =>
    String(hourlyTimes[index] || "").startsWith(marketDate)
  );

  const avgHumidity = matchingHumidity.length
    ? Math.round(
        matchingHumidity.reduce((sum, value) => sum + Number(value || 0), 0) /
          matchingHumidity.length
      )
    : null;

  const weatherCode = getDailyValue(weather, "weather_code", dateIndex);

  return {
    available: true,
    locationName: [location.name, location.admin1].filter(Boolean).join(", "),
    date: marketDate,
    highTemp: Math.round(getDailyValue(weather, "temperature_2m_max", dateIndex)),
    lowTemp: Math.round(getDailyValue(weather, "temperature_2m_min", dateIndex)),
    precipitationChance: getDailyValue(weather, "precipitation_probability_max", dateIndex),
    precipitationSum: getDailyValue(weather, "precipitation_sum", dateIndex),
    windSpeedMax: Math.round(getDailyValue(weather, "wind_speed_10m_max", dateIndex)),
    humidity: avgHumidity,
    conditions: WEATHER_CODES[weatherCode] || "Forecast available",
    message: ""
  };
}
