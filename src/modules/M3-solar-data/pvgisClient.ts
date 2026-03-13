import { SolarIrradiance } from "@/lib/types";
import { HANNOVER_FALLBACK_SOLAR } from "@/lib/constants";
import { PVGISParams, PVGISResponse } from "./types";

// Cache: key = "lat,lng,tilt,azimuth"
const cache = new Map<string, SolarIrradiance>();

export async function fetchSolarData(params: PVGISParams): Promise<SolarIrradiance> {
  const cacheKey = `${params.lat.toFixed(4)},${params.lng.toFixed(4)},${params.tilt},${params.azimuth}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // PVGIS uses aspect: 0=south, 90=west, -90=east, 180=north
    // Our azimuth: 0=south, 90=west (same convention)
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lon: params.lng.toString(),
      angle: params.tilt.toString(),
      aspect: params.azimuth.toString(),
      outputformat: "json",
      mountingplace: "building",
      loss: "14",
      components: "1",
    });

    const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${searchParams}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h

    if (!res.ok) throw new Error("PVGIS API error");

    const data: PVGISResponse = await res.json();
    const monthly = data.outputs.monthly.fixed;

    const result: SolarIrradiance = {
      monthlyIrradiance: monthly.map((m) => Math.round(m.H_i_m * 10) / 10),
      annualIrradiance: Math.round(data.outputs.totals.fixed.H_i_y),
      sunHoursPerYear: Math.round(data.outputs.totals.fixed.H_i_y),
      avgTemperature: monthly.map((m) => Math.round(m.T2m * 10) / 10),
    };

    cache.set(cacheKey, result);
    return result;
  } catch {
    // Fallback to Hannover average values
    return {
      monthlyIrradiance: HANNOVER_FALLBACK_SOLAR.monthlyIrradiance,
      annualIrradiance: HANNOVER_FALLBACK_SOLAR.annualIrradiance,
      sunHoursPerYear: HANNOVER_FALLBACK_SOLAR.sunHoursPerYear,
      avgTemperature: HANNOVER_FALLBACK_SOLAR.avgTemperature,
    };
  }
}
