export type { Recommendations } from "@/lib/types";

import { RoofAnalysis, SolarIrradiance, PanelTier } from "@/lib/types";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";
import { FinancialCalcOutput } from "@/modules/M5-financial-calc/types";

export interface RecommendationInput {
  roof: RoofAnalysis;
  solar: SolarIrradiance;
  energy: EnergyCalcOutput;
  financial: FinancialCalcOutput;
  userInput: {
    monthlyBill: number;
    hasEV: boolean;
    wantsBattery: "yes" | "no" | "unsure";
    panelTier: PanelTier;
  };
}
