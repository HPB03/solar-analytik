import { PanelTier } from "@/lib/types";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";

export type { FinancialSummary, PanelTier } from "@/lib/types";

export interface SubsidyDetail {
  id: string;
  name: string;
  type: "grant" | "loan" | "tax";
  amount: number;       // calculated amount for this system (€)
  description: string;
  url: string;
}

export interface InstallationCostRange {
  base: number;   // calculated estimate
  min: number;    // −15% (best offer)
  max: number;    // +15% (premium installer)
}

export interface FinancialCalcInput {
  energy: EnergyCalcOutput;
  withBattery: boolean;
  panelTier: PanelTier;
  roofAreaM2: number;
  hasHeatPump?: boolean;
}

export interface FinancialCalcOutput {
  feedInRevenue: number;
  savedOnBill: number;
  annualSavings: number;
  installationCostRange: InstallationCostRange;
  batteryCost: number;
  totalCost: number;
  availableSubsidies: SubsidyDetail[];
  totalSubsidies: number;
  subsidyNames: string[];           // kept for backwards compat
  netCost: number;
  paybackYears: number;
  roi25Years: number;               // cumulative savings − net cost (nominal)
  npv: number;                      // Net Present Value at 3% discount rate
  verdict: "profitable" | "marginal" | "not_profitable";
  score: number;
}

export interface ScenarioComparison {
  withoutBattery: FinancialCalcOutput;
  withBattery: FinancialCalcOutput;
}
