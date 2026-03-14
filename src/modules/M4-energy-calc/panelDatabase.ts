import panelsData from "../../../data/panels.json";
import { PanelTier } from "./types";

export interface PanelSpec {
  name: string;
  brand: string;
  efficiency: number;
  powerWp: number;
  sizM2: number;
  pricePerKwp: number;
  warrantyYears: number;
  degradationPerYear: number;
  tempCoefficient: number; // power loss per °C above 25°C (negative, e.g. -0.003)
}

export interface InverterSpec {
  efficiency: number;
  costPerKwp: number;
}

export function getPanel(tier: PanelTier): PanelSpec {
  return panelsData.panels[tier] as PanelSpec;
}

export function getInverter(): InverterSpec {
  return panelsData.inverters;
}

export const MOUNTING_COST_PER_M2: number = panelsData.mountingCostPerM2;
