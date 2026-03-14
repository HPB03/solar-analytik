import tariffsData from "../../../data/tariffs-hannover.json";

export function getFeedInRate(systemSizeKwp: number): number {
  if (systemSizeKwp <= 10) return tariffsData.feedInTariff.upTo10kWp;
  if (systemSizeKwp <= 40) return tariffsData.feedInTariff.upTo40kWp;
  return tariffsData.feedInTariff.upTo100kWp;
}

export const ELECTRICITY_PRICE_INFLATION = tariffsData.electricityPriceInflationPerYear;
