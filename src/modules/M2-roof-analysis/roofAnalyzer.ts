import { HANNOVER_OPTIMAL_TILT, ROOF_USABILITY_FACTOR } from "@/lib/constants";
import { RoofAnalysis } from "./types";
import {
  calculateOptimalTilt,
  calculateTiltLoss,
  determineShadingFactor,
} from "./angleOptimizer";

// ---------- Google Solar API types ----------

interface GoogleSolarSegment {
  pitchDegrees: number;
  azimuthDegrees: number; // 0=north, 90=east, 180=south, 270=west
  stats: { areaMeters2: number };
}

interface GoogleSolarResponse {
  solarPotential?: {
    maxSunshineHoursPerYear: number;
    wholeRoofStats: { areaMeters2: number };
    roofSegmentStats: GoogleSolarSegment[];
  };
}

// ---------- Helpers ----------

/** Convert Google compass bearing (0=north) to app convention (0=south). */
function googleToAppAzimuth(googleAz: number): number {
  let az = googleAz - 180;
  if (az > 180) az -= 360;
  return az;
}

/** Pick the best segment: prefer south-facing (Google az 135–225°), then largest. */
function pickBestSegment(segments: GoogleSolarSegment[]): GoogleSolarSegment {
  const southFacing = segments.filter(
    (s) => s.azimuthDegrees >= 135 && s.azimuthDegrees <= 225
  );
  const pool = southFacing.length > 0 ? southFacing : segments;
  return pool.reduce((best, seg) =>
    seg.stats.areaMeters2 > best.stats.areaMeters2 ? seg : best
  );
}

function assessConfidence(
  segments: GoogleSolarSegment[],
  hasSouthFacing: boolean
): "high" | "medium" | "low" {
  if (segments.length === 0) return "low";
  if (!hasSouthFacing) return "medium";
  const best = pickBestSegment(segments);
  if (best.stats.areaMeters2 * ROOF_USABILITY_FACTOR < 15) return "low";
  return "high";
}

function buildSatelliteImageUrl(lat: number, lng: number, apiKey: string): string {
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}&zoom=19&size=400x300&maptype=satellite&key=${apiKey}`
  );
}

function buildFallback(): RoofAnalysis {
  return {
    roofArea: 30,
    tilt: HANNOVER_OPTIMAL_TILT,
    azimuth: 0,
    shadingFactor: 0.05,
    optimalTilt: HANNOVER_OPTIMAL_TILT,
    tiltLossPercent: 0,
    canAdjustTilt: true,
    confidence: "low",
    needsPhoto: true,
    satelliteImageUrl: "",
  };
}

// ---------- Main ----------

export async function analyzeRoof(lat: number, lng: number): Promise<RoofAnalysis> {
  const apiKey = process.env.GOOGLE_SOLAR_API_KEY;
  if (!apiKey) return buildFallback();

  try {
    const url =
      `https://solar.googleapis.com/v1/buildingInsights:findClosest` +
      `?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return buildFallback();

    const data: GoogleSolarResponse = await res.json();
    const segments = data.solarPotential?.roofSegmentStats ?? [];
    if (segments.length === 0) return buildFallback();

    const hasSouthFacing = segments.some(
      (s) => s.azimuthDegrees >= 135 && s.azimuthDegrees <= 225
    );
    const best = pickBestSegment(segments);
    const optimalTilt = calculateOptimalTilt(lat);
    const appAzimuth = googleToAppAzimuth(best.azimuthDegrees);
    const tiltLossPercent = calculateTiltLoss(best.pitchDegrees, optimalTilt, appAzimuth);
    const shadingFactor = determineShadingFactor(
      data.solarPotential?.maxSunshineHoursPerYear
    );
    const confidence = assessConfidence(segments, hasSouthFacing);

    return {
      roofArea: Math.round(best.stats.areaMeters2 * ROOF_USABILITY_FACTOR),
      tilt: Math.round(best.pitchDegrees),
      azimuth: Math.round(appAzimuth),
      shadingFactor,
      optimalTilt,
      tiltLossPercent,
      canAdjustTilt: best.pitchDegrees >= 5 && best.pitchDegrees <= 50,
      confidence,
      needsPhoto: confidence === "low" || !hasSouthFacing,
      satelliteImageUrl: buildSatelliteImageUrl(lat, lng, apiKey),
    };
  } catch {
    return buildFallback();
  }
}
