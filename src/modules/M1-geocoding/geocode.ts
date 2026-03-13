import { GeocodeResult, MapboxSuggestion } from "@/lib/types";
import { HANNOVER_BOUNDS, HANNOVER_CENTER } from "@/lib/constants";
import { MapboxGeocodeResponse } from "./types";

function isInHannoverRegion(lng: number, lat: number): boolean {
  return (
    lng >= HANNOVER_BOUNDS.minLng &&
    lng <= HANNOVER_BOUNDS.maxLng &&
    lat >= HANNOVER_BOUNDS.minLat &&
    lat <= HANNOVER_BOUNDS.maxLat
  );
}

function extractCity(feature: { context?: Array<{ id: string; text: string }> }): string {
  if (!feature.context) return "";
  const placeCtx = feature.context.find((c) => c.id.startsWith("place."));
  const districtCtx = feature.context.find((c) => c.id.startsWith("district."));
  return placeCtx?.text ?? districtCtx?.text ?? "";
}

export async function fetchSuggestions(
  query: string,
  token: string
): Promise<MapboxSuggestion[]> {
  if (query.length < 3) return [];

  const params = new URLSearchParams({
    access_token: token,
    country: "de",
    language: "de",
    limit: "5",
    types: "address,place",
    proximity: `${HANNOVER_CENTER.lng},${HANNOVER_CENTER.lat}`,
    bbox: `${HANNOVER_BOUNDS.minLng},${HANNOVER_BOUNDS.minLat},${HANNOVER_BOUNDS.maxLng},${HANNOVER_BOUNDS.maxLat}`,
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Mapbox geocoding failed");

  const data: MapboxGeocodeResponse = await res.json();

  return data.features.map((f) => ({
    id: f.id,
    place_name: f.place_name,
    center: f.center,
    context: f.context,
  }));
}

export function suggestionToGeocodeResult(
  suggestion: MapboxSuggestion
): GeocodeResult {
  const [lng, lat] = suggestion.center;
  const city = extractCity(suggestion as { context?: Array<{ id: string; text: string }> });

  return {
    lat,
    lng,
    formattedAddress: suggestion.place_name,
    city,
    isSupported: isInHannoverRegion(lng, lat),
  };
}
