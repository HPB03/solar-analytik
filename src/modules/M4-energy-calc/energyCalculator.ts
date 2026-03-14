import {
  SYSTEM_LOSSES,
  ELECTRICITY_PRICE_PER_KWH,
  SELF_CONSUMPTION_WITHOUT_BATTERY,
  SELF_CONSUMPTION_WITH_BATTERY,
} from "@/lib/constants";
import panelsData from "../../../data/panels.json";
import { EnergyCalcInput, EnergyCalcOutput } from "./types";

export function calculateEnergy(input: EnergyCalcInput): EnergyCalcOutput {
  const { solar, monthlyBill, panelTier, roofAreaM2, hasEV, withBattery } = input;
  const panel = panelsData.panels[panelTier];
  const inverterEff = panelsData.inverters.efficiency;

  const panelCount = Math.floor(roofAreaM2 / panel.sizM2);
  const systemSizeKwp = (panelCount * panel.powerWp) / 1000;

  const totalLoss =
    SYSTEM_LOSSES.temperature +
    SYSTEM_LOSSES.cable +
    (1 - inverterEff) +
    SYSTEM_LOSSES.mismatch;

  const annualProduction = Math.round(
    solar.annualIrradiance * systemSizeKwp * (1 - totalLoss)
  );

  const irradianceSum = solar.monthlyIrradiance.reduce((a, b) => a + b, 0);
  const monthlyProduction = solar.monthlyIrradiance.map((irr) =>
    Math.round((irr / irradianceSum) * annualProduction)
  );

  const annualConsumption = Math.round((monthlyBill / ELECTRICITY_PRICE_PER_KWH) * 12);
  const totalConsumption = annualConsumption + (hasEV ? 2000 : 0);

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
  };
}
