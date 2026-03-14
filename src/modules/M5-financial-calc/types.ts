import { PanelTier } from "@/lib/types";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";

export type { FinancialSummary, PanelTier } from "@/lib/types";

export interface FinancialCalcInput {
  energy: EnergyCalcOutput;
  withBattery: boolean;
  panelTier: PanelTier;
  roofAreaM2: number;
}

export interface FinancialCalcOutput {
  feedInRevenue: number;
  savedOnBill: number;
  annualSavings: number;
  installCost: number;
  batteryCost: number;
  totalCost: number;
  totalSubsidies: number;
  subsidyNames: string[];
  netCost: number;
  paybackYears: number;
  roi25Years: number;
  verdict: "profitable" | "marginal" | "not_profitable";
  score: number;
}
