import { SolarIrradiance, PanelTier } from "@/lib/types";

export type { EnergyProduction, PanelTier } from "@/lib/types";

export interface EnergyCalcInput {
  solar: SolarIrradiance;
  monthlyBill: number;
  panelTier: PanelTier;
  roofAreaM2: number;
  hasEV: boolean;
  withBattery: boolean;
  shadingFactor?: number; // 0–1 from M2 roof analysis (default 0)
}

export interface LossBreakdown {
  temperature: number;  // % from panel tempCoefficient × avg summer temp
  cable: number;        // % fixed cable losses
  inverter: number;     // % inverter efficiency loss
  mismatch: number;     // % panel mismatch losses
  shading: number;      // % from roof shadingFactor
  total: number;        // % combined
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
  lossBreakdown: LossBreakdown;
}
