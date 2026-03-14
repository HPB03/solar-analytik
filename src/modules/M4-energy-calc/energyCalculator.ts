import {
  SYSTEM_LOSSES,
  ELECTRICITY_PRICE_PER_KWH,
  SELF_CONSUMPTION_WITHOUT_BATTERY,
  SELF_CONSUMPTION_WITH_BATTERY,
} from "@/lib/constants";
import { getPanel, getInverter } from "./panelDatabase";
import { EnergyCalcInput, EnergyCalcOutput, LossBreakdown } from "./types";

// Average summer temperature for Hannover (Jun–Aug), used for temperature loss
const AVG_SUMMER_TEMP_HANNOVER = 18.7;
// Standard Test Condition temperature for panels
const STC_TEMP = 25;
// Typical operating temperature offset above ambient
const NOCT_OFFSET = 25;

/**
 * Calculates temperature-based power loss for a panel.
 * Formula: tempCoefficient × max(operatingTemp − STC, 0)
 * operatingTemp ≈ ambientTemp + NOCT_OFFSET (25°C above ambient)
 */
export function calcTemperatureLoss(
  tempCoefficientPerC: number,
  avgSummerTemp: number = AVG_SUMMER_TEMP_HANNOVER
): number {
  const operatingTemp = avgSummerTemp + NOCT_OFFSET;
  const loss = Math.abs(tempCoefficientPerC) * Math.max(operatingTemp - STC_TEMP, 0);
  return Math.round(loss * 1000) / 1000;
}

export function calculateEnergy(input: EnergyCalcInput): EnergyCalcOutput {
  const { solar, monthlyBill, panelTier, roofAreaM2, hasEV, withBattery } = input;
  const shadingFactor = input.shadingFactor ?? 0;

  const panel = getPanel(panelTier);
  const inverter = getInverter();

  // System size
  const panelCount = Math.floor(roofAreaM2 / panel.sizM2);
  const systemSizeKwp = (panelCount * panel.powerWp) / 1000;

  // Loss breakdown
  const avgSummerTemp =
    solar.avgTemperature.length >= 8
      ? (solar.avgTemperature[5] + solar.avgTemperature[6] + solar.avgTemperature[7]) / 3
      : AVG_SUMMER_TEMP_HANNOVER;

  const tempLoss = calcTemperatureLoss(panel.tempCoefficient, avgSummerTemp);
  const cableLoss = SYSTEM_LOSSES.cable;
  const inverterLoss = 1 - inverter.efficiency;
  const mismatchLoss = SYSTEM_LOSSES.mismatch;
  const totalLoss = tempLoss + cableLoss + inverterLoss + mismatchLoss + shadingFactor;

  const lossBreakdown: LossBreakdown = {
    temperature: Math.round(tempLoss * 1000) / 10,   // as %
    cable:       Math.round(cableLoss * 1000) / 10,
    inverter:    Math.round(inverterLoss * 1000) / 10,
    mismatch:    Math.round(mismatchLoss * 1000) / 10,
    shading:     Math.round(shadingFactor * 1000) / 10,
    total:       Math.round(totalLoss * 1000) / 10,
  };

  // Annual production
  const annualProduction = Math.round(
    solar.annualIrradiance * systemSizeKwp * (1 - totalLoss)
  );

  // Monthly production proportional to irradiance distribution
  const irradianceSum = solar.monthlyIrradiance.reduce((a, b) => a + b, 0);
  const monthlyProduction = solar.monthlyIrradiance.map((irr) =>
    Math.round((irr / irradianceSum) * annualProduction)
  );

  // Consumption
  const annualConsumption = Math.round((monthlyBill / ELECTRICITY_PRICE_PER_KWH) * 12);
  const totalConsumption = annualConsumption + (hasEV ? 2000 : 0);

  // Self-consumption
  const selfConsumptionRate = withBattery
    ? SELF_CONSUMPTION_WITH_BATTERY
    : SELF_CONSUMPTION_WITHOUT_BATTERY;

  const selfConsumed = Math.round(
    Math.min(annualProduction * selfConsumptionRate, totalConsumption)
  );
  const gridFeedIn = annualProduction - selfConsumed;
  const coveragePercent = Math.round((selfConsumed / totalConsumption) * 100);

  return {
    panelCount,
    systemSizeKwp,
    annualProduction,
    monthlyProduction,
    selfConsumed,
    gridFeedIn,
    coveragePercent,
    annualConsumption: totalConsumption,
    lossBreakdown,
  };
}
