import {
  ELECTRICITY_PRICE_PER_KWH,
  BATTERY_COST_PER_KWH,
  TYPICAL_BATTERY_KWH,
} from "@/lib/constants";
import panelsData from "../../../data/panels.json";
import { getFeedInRate, ELECTRICITY_PRICE_INFLATION } from "./tariffs";
import { calculateSubsidies } from "./subsidies";
import { FinancialCalcInput, FinancialCalcOutput } from "./types";

export function calculateFinancials(input: FinancialCalcInput): FinancialCalcOutput {
  const { energy, withBattery, panelTier, roofAreaM2 } = input;
  const panel = panelsData.panels[panelTier];

  const feedInRate = getFeedInRate(energy.systemSizeKwp);
  const feedInRevenue = Math.round(energy.gridFeedIn * feedInRate);
  const savedOnBill = Math.round(energy.selfConsumed * ELECTRICITY_PRICE_PER_KWH);
  const annualSavings = savedOnBill + feedInRevenue;

  const panelCost = energy.systemSizeKwp * panel.pricePerKwp;
  const inverterCost = energy.systemSizeKwp * panelsData.inverters.costPerKwp;
  const mountingCost = roofAreaM2 * panelsData.mountingCostPerM2 * 0.5;
  const installCost = panelCost + inverterCost + mountingCost;
  const batteryCost = withBattery ? TYPICAL_BATTERY_KWH * BATTERY_COST_PER_KWH : 0;
  const totalCost = installCost + batteryCost;

  const { total: totalSubsidies, names: subsidyNames } = calculateSubsidies(
    energy.systemSizeKwp,
    withBattery
  );
  const netCost = totalCost - totalSubsidies;

  const paybackYears = annualSavings > 0 ? netCost / annualSavings : 99;

  let cumSavings = 0;
  for (let y = 1; y <= 25; y++) {
    const degradation = Math.pow(1 - panel.degradationPerYear, y);
    const inflationBonus = Math.pow(1 + ELECTRICITY_PRICE_INFLATION, y);
    cumSavings += annualSavings * degradation * inflationBonus;
  }
  const roi25Years = Math.round(cumSavings - netCost);

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
    installCost: Math.round(installCost),
    batteryCost: Math.round(batteryCost),
    totalCost: Math.round(totalCost),
    totalSubsidies: Math.round(totalSubsidies),
    subsidyNames,
    netCost: Math.round(netCost),
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi25Years,
    verdict,
    score,
  };
}
