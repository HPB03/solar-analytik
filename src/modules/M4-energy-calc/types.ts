import { SolarIrradiance, PanelTier } from "@/lib/types";

export type { EnergyProduction, PanelTier } from "@/lib/types";

export interface EnergyCalcInput {
  solar: SolarIrradiance;
  monthlyBill: number;
  panelTier: PanelTier;
  roofAreaM2: number;
  hasEV: boolean;
  withBattery: boolean;
}

export interface EnergyCalcOutput {
  panelCount: number;
  systemSizeKwp: number;
  annualProduction: number;
  monthlyProduction: number[];
  selfConsumed: number;
  gridFeedIn: number;
  coveragePercent: number;
  annualConsumption: number;
}
