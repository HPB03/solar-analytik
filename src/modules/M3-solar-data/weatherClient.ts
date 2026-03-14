import { CurrentWeather } from "@/lib/types";

interface OWMResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  clouds: { all: number };
  wind: { speed: number };
  weather: Array<{ description: string; icon: string }>;
  cod: number;
}

// Server-side only: uses OPENWEATHER_API_KEY from .env.local
export async function fetchCurrentWeather(
  lat: number,
  lng: number
): Promise<CurrentWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=de`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1h cache
    if (!res.ok) return null;

    const data: OWMResponse = await res.json();

    return {
      temperature: Math.round(data.main.temp * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      cloudCover: data.clouds.all,
      description: data.weather[0]?.description ?? "",
      icon: data.weather[0]?.icon ?? "",
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      city: data.name,
    };
  } catch {
    return null;
  }
}

/**
 * Estimates today's solar production factor (0–1) based on cloud cover.
 * Clear sky = 1.0, fully overcast = ~0.15 (diffuse light still produces).
 */
export function estimateTodayFactor(cloudCoverPercent: number): number {
  return Math.round((1 - cloudCoverPercent / 100 * 0.85) * 100) / 100;
}
