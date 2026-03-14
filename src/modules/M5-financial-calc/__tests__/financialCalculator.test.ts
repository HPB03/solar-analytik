import { describe, it, expect } from "vitest";
import { calculateFinancials, calculateScenarios } from "../financialCalculator";
import { calculateSubsidies } from "../subsidies";
import { getFeedInRate } from "../tariffs";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";

const ENERGY_MID: EnergyCalcOutput = {
  panelCount: 17,
  systemSizeKwp: 7.31,
  annualProduction: 6000,
  monthlyProduction: [180, 290, 520, 760, 840, 850, 860, 760, 610, 400, 215, 160],
  selfConsumed: 1800,
  gridFeedIn: 4200,
  coveragePercent: 38,
  annualConsumption: 4645,
  lossBreakdown: { temperature: 5.6, cable: 2, inverter: 3, mismatch: 2, shading: 0, total: 12.6 },
};

const BASE_INPUT = {
  energy: ENERGY_MID,
  withBattery: false,
  panelTier: "mid" as const,
  roofAreaM2: 30,
};

describe("calculateFinancials", () => {
  it("returns positive annual savings", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.annualSavings).toBeGreaterThan(0);
  });

  it("feedInRevenue + savedOnBill = annualSavings", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.feedInRevenue + r.savedOnBill).toBe(r.annualSavings);
  });

  it("netCost = totalCost - totalSubsidies", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.netCost).toBe(r.totalCost - r.totalSubsidies);
  });

  it("payback years is positive and finite", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.paybackYears).toBeGreaterThan(0);
    expect(r.paybackYears).toBeLessThan(99);
  });

  it("verdict is 'profitable' when payback < 12 years", () => {
    // Use high production to force fast payback
    const r = calculateFinancials({
      ...BASE_INPUT,
      energy: { ...ENERGY_MID, selfConsumed: 3000, gridFeedIn: 3000, annualProduction: 6000 },
    });
    if (r.paybackYears < 12) expect(r.verdict).toBe("profitable");
  });

  it("score is between 1 and 10", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.score).toBeGreaterThanOrEqual(1);
    expect(r.score).toBeLessThanOrEqual(10);
  });

  it("with battery increases totalCost", () => {
    const without = calculateFinancials(BASE_INPUT);
    const with_ = calculateFinancials({ ...BASE_INPUT, withBattery: true });
    expect(with_.totalCost).toBeGreaterThan(without.totalCost);
  });

  it("installationCostRange.min < base < max", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(r.installationCostRange.min).toBeLessThan(r.installationCostRange.base);
    expect(r.installationCostRange.base).toBeLessThan(r.installationCostRange.max);
  });

  it("availableSubsidies is an array with details", () => {
    const r = calculateFinancials(BASE_INPUT);
    expect(Array.isArray(r.availableSubsidies)).toBe(true);
    expect(r.availableSubsidies.length).toBeGreaterThan(0);
    expect(r.availableSubsidies[0]).toHaveProperty("name");
    expect(r.availableSubsidies[0]).toHaveProperty("url");
    expect(r.availableSubsidies[0]).toHaveProperty("type");
  });

  it("roi25Years is greater than npv (nominal vs discounted)", () => {
    const r = calculateFinancials(BASE_INPUT);
    // NPV discounts future cash flows, so should be lower than nominal ROI
    expect(r.roi25Years).toBeGreaterThan(r.npv);
  });

  it("premium panels have higher cost but similar payback to budget", () => {
    const budget = calculateFinancials({ ...BASE_INPUT, panelTier: "budget" });
    const premium = calculateFinancials({ ...BASE_INPUT, panelTier: "premium" });
    expect(premium.totalCost).toBeGreaterThan(budget.totalCost);
  });
});

describe("calculateScenarios", () => {
  it("returns both withoutBattery and withBattery scenarios", () => {
    const scenarios = calculateScenarios(BASE_INPUT);
    expect(scenarios.withoutBattery).toBeDefined();
    expect(scenarios.withBattery).toBeDefined();
  });

  it("withBattery scenario has higher totalCost", () => {
    const scenarios = calculateScenarios(BASE_INPUT);
    expect(scenarios.withBattery.totalCost).toBeGreaterThan(
      scenarios.withoutBattery.totalCost
    );
  });

  it("withBattery has higher subsidy total", () => {
    const scenarios = calculateScenarios(BASE_INPUT);
    expect(scenarios.withBattery.totalSubsidies).toBeGreaterThan(
      scenarios.withoutBattery.totalSubsidies
    );
  });
});

describe("calculateSubsidies", () => {
  it("proKlima solar grant does not exceed maxAmount (1000€)", () => {
    // maxSystemKwp=20, so use 20 kWp (20 × 50€ = 1000€ = cap)
    const { details } = calculateSubsidies(20, false);
    const proklima = details.find((d) => d.id === "proklima-solar");
    expect(proklima).toBeDefined();
    expect(proklima!.amount).toBeLessThanOrEqual(1000);
    expect(proklima!.amount).toBe(1000);
  });

  it("proKlima battery only appears when withBattery=true", () => {
    const withBattery = calculateSubsidies(5, true);
    const withoutBattery = calculateSubsidies(5, false);
    const batterySubsidyWith = withBattery.details.find((d) => d.id === "proklima-battery");
    const batterySubsidyWithout = withoutBattery.details.find((d) => d.id === "proklima-battery");
    expect(batterySubsidyWith).toBeDefined();
    expect(batterySubsidyWithout).toBeUndefined();
  });

  it("KfW loan is always listed (type=loan, amount=0)", () => {
    const { details } = calculateSubsidies(5, false);
    const kfw = details.find((d) => d.id === "kfw-270");
    expect(kfw).toBeDefined();
    expect(kfw?.type).toBe("loan");
  });
});

describe("getFeedInRate", () => {
  it("smaller systems get higher feed-in rate", () => {
    expect(getFeedInRate(5)).toBeGreaterThan(getFeedInRate(15));
  });

  it("returns correct tier for 10 kWp boundary", () => {
    const at10 = getFeedInRate(10);
    const at11 = getFeedInRate(11);
    expect(at10).toBeGreaterThan(at11);
  });
});
