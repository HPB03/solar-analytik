import { describe, it, expect } from "vitest";
import { calculateEnergy, calcTemperatureLoss } from "../energyCalculator";
import { SolarIrradiance } from "@/lib/types";

// Hannover typical solar data (real PVGIS values)
const HANNOVER_SOLAR: SolarIrradiance = {
  monthlyIrradiance: [34.4, 54.9, 98.4, 146.3, 161.5, 163.8, 164.8, 146, 117.6, 77, 41.3, 30.8],
  annualIrradiance: 1237,
  sunHoursPerYear: 1477,
  avgTemperature: [1.2, 1.8, 5.5, 9.8, 14.5, 17.6, 19.4, 19, 14.8, 10.1, 5.2, 2],
};

const BASE_INPUT = {
  solar: HANNOVER_SOLAR,
  monthlyBill: 120,
  panelTier: "mid" as const,
  roofAreaM2: 30,
  hasEV: false,
  withBattery: false,
};

describe("calculateEnergy", () => {
  it("returns correct panel count for 30m² roof with mid panels (1.72m² each)", () => {
    const result = calculateEnergy(BASE_INPUT);
    expect(result.panelCount).toBe(17); // floor(30 / 1.72) = 17
  });

  it("calculates system size correctly", () => {
    const result = calculateEnergy(BASE_INPUT);
    // 17 panels × 430Wp = 7310Wp = 7.31 kWp
    expect(result.systemSizeKwp).toBeCloseTo(7.31, 1);
  });

  it("annual production is positive and physically plausible", () => {
    const result = calculateEnergy(BASE_INPUT);
    expect(result.annualProduction).toBeGreaterThan(1000);
    expect(result.annualProduction).toBeLessThan(20000);
  });

  it("monthly production sums to approximately annual production", () => {
    const result = calculateEnergy(BASE_INPUT);
    const monthlySum = result.monthlyProduction.reduce((a, b) => a + b, 0);
    // Allow ±2% rounding difference
    expect(Math.abs(monthlySum - result.annualProduction)).toBeLessThan(
      result.annualProduction * 0.02
    );
  });

  it("monthly production has 12 entries", () => {
    const result = calculateEnergy(BASE_INPUT);
    expect(result.monthlyProduction).toHaveLength(12);
  });

  it("June/July production is higher than December/January", () => {
    const result = calculateEnergy(BASE_INPUT);
    const summerAvg = (result.monthlyProduction[5] + result.monthlyProduction[6]) / 2;
    const winterAvg = (result.monthlyProduction[0] + result.monthlyProduction[11]) / 2;
    expect(summerAvg).toBeGreaterThan(winterAvg * 3);
  });

  it("gridFeedIn + selfConsumed === annualProduction", () => {
    const result = calculateEnergy(BASE_INPUT);
    expect(result.selfConsumed + result.gridFeedIn).toBe(result.annualProduction);
  });

  it("coverage is higher with battery than without", () => {
    const withoutBattery = calculateEnergy({ ...BASE_INPUT, withBattery: false });
    const withBattery = calculateEnergy({ ...BASE_INPUT, withBattery: true });
    expect(withBattery.coveragePercent).toBeGreaterThan(withoutBattery.coveragePercent);
  });

  it("EV adds 2000 kWh to annual consumption", () => {
    const withoutEV = calculateEnergy(BASE_INPUT);
    const withEV = calculateEnergy({ ...BASE_INPUT, hasEV: true });
    expect(withEV.annualConsumption - withoutEV.annualConsumption).toBe(2000);
  });

  it("shading reduces annual production", () => {
    const noShading = calculateEnergy({ ...BASE_INPUT, shadingFactor: 0 });
    const withShading = calculateEnergy({ ...BASE_INPUT, shadingFactor: 0.35 });
    expect(withShading.annualProduction).toBeLessThan(noShading.annualProduction);
    // 35% shading should reduce output by roughly 35%
    const reduction = 1 - withShading.annualProduction / noShading.annualProduction;
    expect(reduction).toBeGreaterThan(0.25);
    expect(reduction).toBeLessThan(0.45);
  });

  it("premium panels produce more than budget panels on same roof", () => {
    const budget = calculateEnergy({ ...BASE_INPUT, panelTier: "budget" });
    const premium = calculateEnergy({ ...BASE_INPUT, panelTier: "premium" });
    expect(premium.annualProduction).toBeGreaterThan(budget.annualProduction);
  });

  it("lossBreakdown total matches individual losses (approx)", () => {
    const result = calculateEnergy(BASE_INPUT);
    const { temperature, cable, inverter, mismatch, shading, total } = result.lossBreakdown;
    const sum = temperature + cable + inverter + mismatch + shading;
    expect(Math.abs(sum - total)).toBeLessThan(0.5); // rounding tolerance
  });

  it("zero roof area returns zero panels and zero production", () => {
    const result = calculateEnergy({ ...BASE_INPUT, roofAreaM2: 0 });
    expect(result.panelCount).toBe(0);
    expect(result.annualProduction).toBe(0);
  });
});

describe("calcTemperatureLoss", () => {
  it("mid panel at Hannover summer temp gives plausible loss", () => {
    // tempCoefficient = -0.003, avgSummerTemp = 18.7°C, NOCT_OFFSET = 25°C
    // operatingTemp = 43.7°C, loss = 0.003 × (43.7 − 25) = 0.003 × 18.7 = 0.0561
    const loss = calcTemperatureLoss(-0.003, 18.7);
    expect(loss).toBeCloseTo(0.056, 2);
  });

  it("premium panel loses less than budget panel at same temperature", () => {
    const budgetLoss = calcTemperatureLoss(-0.0035, 20); // budget tempCoefficient
    const premiumLoss = calcTemperatureLoss(-0.0025, 20); // premium tempCoefficient
    expect(premiumLoss).toBeLessThan(budgetLoss);
  });

  it("returns 0 if operating temp is below STC (25°C)", () => {
    const loss = calcTemperatureLoss(-0.003, -10); // cold day: -10 + 25 = 15°C < 25°C
    expect(loss).toBe(0);
  });
});
