import {
  ELECTRICITY_PRICE_PER_KWH,
  BATTERY_COST_PER_KWH,
  TYPICAL_BATTERY_KWH,
} from "@/lib/constants";
import { getPanel, getInverter, MOUNTING_COST_PER_M2 } from "@/modules/M4-energy-calc/panelDatabase";
import { getFeedInRate, ELECTRICITY_PRICE_INFLATION } from "./tariffs";
import { calculateSubsidies } from "./subsidies";
import {
  FinancialCalcInput,
  FinancialCalcOutput,
  ScenarioComparison,
} from "./types";

// Discount rate for NPV (opportunity cost / inflation-adjusted)
const DISCOUNT_RATE = 0.03;
// ±15% installation cost range (market spread between installers)
const COST_RANGE_FACTOR = 0.15;

/**
 * Net Present Value of the investment over 25 years.
 * NPV = Σ(cashFlow_y / (1 + r)^y) − initialInvestment
 */
function calcNPV(
  annualSavings: number,
  netCost: number,
  degradationPerYear: number
): number {
  let npv = -netCost;
  for (let y = 1; y <= 25; y++) {
    const degradation = Math.pow(1 - degradationPerYear, y);
    const inflated = annualSavings * degradation * Math.pow(1 + ELECTRICITY_PRICE_INFLATION, y);
    npv += inflated / Math.pow(1 + DISCOUNT_RATE, y);
  }
  return Math.round(npv);
}

export function calculateFinancials(input: FinancialCalcInput): FinancialCalcOutput {
  const { energy, withBattery, panelTier, roofAreaM2 } = input;
  const panel = getPanel(panelTier);
  const inverter = getInverter();

  // Annual savings
  const feedInRate = getFeedInRate(energy.systemSizeKwp);
  const feedInRevenue = Math.round(energy.gridFeedIn * feedInRate);
  const savedOnBill = Math.round(energy.selfConsumed * ELECTRICITY_PRICE_PER_KWH);
  const annualSavings = savedOnBill + feedInRevenue;

  // Installation costs
  const panelCost = energy.systemSizeKwp * panel.pricePerKwp;
  const inverterCost = energy.systemSizeKwp * inverter.costPerKwp;
  const mountingCost = roofAreaM2 * MOUNTING_COST_PER_M2 * 0.5;
  const installBase = Math.round(panelCost + inverterCost + mountingCost);

  const installationCostRange = {
    base: installBase,
    min: Math.round(installBase * (1 - COST_RANGE_FACTOR)),
    max: Math.round(installBase * (1 + COST_RANGE_FACTOR)),
  };

  const batteryCost = withBattery ? Math.round(TYPICAL_BATTERY_KWH * BATTERY_COST_PER_KWH) : 0;
  const totalCost = installBase + batteryCost;

  // Subsidies
  const { total: totalSubsidies, names: subsidyNames, details: availableSubsidies } =
    calculateSubsidies(energy.systemSizeKwp, withBattery);

  const netCost = totalCost - totalSubsidies;

  // Payback & ROI
  const paybackYears = annualSavings > 0
    ? Math.round((netCost / annualSavings) * 10) / 10
    : 99;

  // Nominal 25-year return (no discounting)
  let cumSavings = 0;
  for (let y = 1; y <= 25; y++) {
    cumSavings +=
      annualSavings *
      Math.pow(1 - panel.degradationPerYear, y) *
      Math.pow(1 + ELECTRICITY_PRICE_INFLATION, y);
  }
  const roi25Years = Math.round(cumSavings - netCost);

  // True NPV
  const npv = calcNPV(annualSavings, netCost, panel.degradationPerYear);

  // Verdict
  let verdict: "profitable" | "marginal" | "not_profitable";
  let score: number;
  if (paybackYears < 12) {
    verdict = "profitable";
    score = Math.round(10 - paybackYears * 0.4);
  } else if (paybackYears < 18) {
    verdict = "marginal";
    score = Math.round(7 - (paybackYears - 12) * 0.3);
  } else {
    verdict = "not_profitable";
    score = Math.max(1, Math.round(5 - paybackYears * 0.2));
  }
  score = Math.min(10, Math.max(1, score));

  return {
    feedInRevenue,
    savedOnBill,
    annualSavings,
    installationCostRange,
    batteryCost,
    totalCost: Math.round(totalCost),
    availableSubsidies,
    totalSubsidies: Math.round(totalSubsidies),
    subsidyNames,
    netCost: Math.round(netCost),
    paybackYears,
    roi25Years,
    npv,
    verdict,
    score,
  };
}

/**
 * Computes both scenarios (with/without battery) in one call.
 * Used by the result page to pre-calculate tab content.
 */
export function calculateScenarios(
  input: Omit<FinancialCalcInput, "withBattery">
): ScenarioComparison {
  return {
    withoutBattery: calculateFinancials({ ...input, withBattery: false }),
    withBattery: calculateFinancials({ ...input, withBattery: true }),
  };
}
