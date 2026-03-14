import { SolarIrradiance } from "@/lib/types";
import { HANNOVER_FALLBACK_SOLAR } from "@/lib/constants";
import { PVGISParams, PVGISResponse } from "./types";

// Days per month (non-leap year)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Correction factor: PVGIS SD_m counts potential sunshine (no clouds),
// empirical ratio for Hannover: actual / potential ≈ 0.49
const SD_CLOUD_CORRECTION = 0.49;

// In-memory cache: key = "lat,lng,tilt,azimuth"
const cache = new Map<string, SolarIrradiance>();

export async function fetchSolarData(params: PVGISParams): Promise<SolarIrradiance> {
  const cacheKey = `${params.lat.toFixed(4)},${params.lng.toFixed(4)},${params.tilt},${params.azimuth}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lon: params.lng.toString(),
      angle: params.tilt.toString(),
      aspect: params.azimuth.toString(),
      peakpower: "1",           // required; we normalise per-kWp
      outputformat: "json",
      mountingplace: "building",
      loss: "14",
      components: "1",
    });

    const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${searchParams}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) throw new Error(`PVGIS ${res.status}`);

    const data: PVGISResponse = await res.json();
    const monthly = data.outputs.monthly.fixed;
    const totals = data.outputs.totals.fixed;

    // Sun hours: SD_m (h/day) × days × cloud-cover correction factor
    const sunHoursPerYear = Math.round(
      monthly.reduce((sum, m, i) => sum + m.SD_m * DAYS_IN_MONTH[i], 0) *
        SD_CLOUD_CORRECTION
    );

    const result: SolarIrradiance = {
      monthlyIrradiance: monthly.map((m) => Math.round(m["H(i)_m"] * 10) / 10),
      annualIrradiance: Math.round(totals["H(i)_y"]),
      sunHoursPerYear,
      // PVGIS v5.2 PVcalc no longer provides T2m — use Hannover climate constants
      avgTemperature: HANNOVER_FALLBACK_SOLAR.avgTemperature,
    };

    cache.set(cacheKey, result);
    return result;
  } catch {
    return {
      monthlyIrradiance: HANNOVER_FALLBACK_SOLAR.monthlyIrradiance,
      annualIrradiance: HANNOVER_FALLBACK_SOLAR.annualIrradiance,
      sunHoursPerYear: HANNOVER_FALLBACK_SOLAR.sunHoursPerYear,
      avgTemperature: HANNOVER_FALLBACK_SOLAR.avgTemperature,
    };
  }
}
