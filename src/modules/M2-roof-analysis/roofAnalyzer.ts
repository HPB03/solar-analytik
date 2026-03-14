import { HANNOVER_OPTIMAL_TILT } from "@/lib/constants";
import { RoofAnalysis } from "./types";

// Placeholder — will be replaced with Google Solar API integration in Week 2
export async function analyzeRoof(lat: number, lng: number): Promise<RoofAnalysis> {
  void lat;
  void lng;
  return {
    roofArea: 30,
    tilt: HANNOVER_OPTIMAL_TILT,
    azimuth: 0,
    shadingFactor: 0,
    optimalTilt: HANNOVER_OPTIMAL_TILT,
    tiltLossPercent: 0,
    canAdjustTilt: true,
    confidence: "low",
    needsPhoto: true,
    satelliteImageUrl: "",
  };
}
