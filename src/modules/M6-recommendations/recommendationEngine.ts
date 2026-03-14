import { Recommendations } from "./types";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";
import { FinancialCalcOutput } from "@/modules/M5-financial-calc/types";

// Placeholder — will be expanded in Week 3
export function generateRecommendations(
  energy: EnergyCalcOutput,
  financial: FinancialCalcOutput
): Recommendations {
  const batteryAdvice =
    energy.coveragePercent < 50
      ? "Ein Batteriespeicher würde Ihren Eigenverbrauch deutlich erhöhen."
      : "Ihr Eigenverbrauch ist bereits gut — Batterie optional.";

  const timingAdvice =
    financial.verdict === "profitable"
      ? "Jetzt ist ein guter Zeitpunkt für die Installation."
      : "Sprechen Sie mehrere Anbieter an, um das beste Angebot zu erhalten.";

  return {
    mainRecommendation: `Eine Solaranlage mit ${energy.panelCount} Panels lohnt sich für Ihr Dach.`,
    optimalSystemSize: `${energy.panelCount} Panels, ${energy.systemSizeKwp.toFixed(1)} kWp`,
    tiltAdvice: "Ihr Dachwinkel ist für Hannover optimal (32°).",
    batteryAdvice,
    timingAdvice,
    warnings: [],
  };
}
