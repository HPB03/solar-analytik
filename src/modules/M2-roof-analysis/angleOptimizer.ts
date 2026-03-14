/**
 * Calculates the optimal PV panel tilt angle for a given latitude.
 * Empirical formula calibrated for Germany: at 52.37°N (Hannover) yields ~32°.
 */
export function calculateOptimalTilt(lat: number): number {
  const tilt = Math.round(lat * 0.76 - 7.4);
  return Math.max(20, Math.min(45, tilt));
}

/**
 * Estimates energy production loss (%) due to tilt and azimuth deviation
 * from the optimal south-facing configuration.
 *
 * @param currentTilt  - actual roof pitch in degrees
 * @param optimalTilt  - optimal tilt for this latitude
 * @param azimuth      - app convention: 0=south, 90=west, -90=east, 180=north
 * @returns loss percentage (0–40)
 */
export function calculateTiltLoss(
  currentTilt: number,
  optimalTilt: number,
  azimuth: number
): number {
  const tiltDiff = ((currentTilt - optimalTilt) * Math.PI) / 180;
  const tiltLoss = (1 - Math.cos(tiltDiff)) * 100;

  // Azimuth penalty: 0% for south (0°), up to ~16% for north (±180°)
  const azRad = (azimuth * Math.PI) / 180;
  const azimuthPenalty = (1 - Math.cos(azRad)) * 8;

  return Math.min(40, Math.max(0, Math.round((tiltLoss + azimuthPenalty) * 10) / 10));
}

/**
 * Maps Google Solar API maxSunshineHoursPerYear to a shading factor (0–1).
 * Hannover baseline: ~1700 hr/yr. Lower values → more shading.
 */
export function determineShadingFactor(maxSunshineHours?: number): number {
  if (!maxSunshineHours) return 0.05;
  const factor = Math.max(0, Math.min(0.6, 1 - maxSunshineHours / 1700));
  return Math.round(factor * 100) / 100;
}
