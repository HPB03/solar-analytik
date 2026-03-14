import { describe, it, expect } from "vitest";
import { generateRecommendations } from "../recommendationEngine";
import { RecommendationInput } from "../types";
import { RoofAnalysis, SolarIrradiance } from "@/lib/types";
import { EnergyCalcOutput } from "@/modules/M4-energy-calc/types";
import { FinancialCalcOutput } from "@/modules/M5-financial-calc/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ROOF_GOOD: RoofAnalysis = {
  roofArea: 40, tilt: 32, azimuth: 0, shadingFactor: 0.05,
  optimalTilt: 32, tiltLossPercent: 0.5, canAdjustTilt: true,
  confidence: "high", needsPhoto: false, satelliteImageUrl: "",
};

const SOLAR: SolarIrradiance = {
  monthlyIrradiance: [34,55,98,146,162,164,165,146,118,77,41,31],
  annualIrradiance: 1237, sunHoursPerYear: 1477,
  avgTemperature: [1.2,1.8,5.5,9.8,14.5,17.6,19.4,19,14.8,10.1,5.2,2],
};

const ENERGY_GOOD: EnergyCalcOutput = {
  panelCount: 23, systemSizeKwp: 9.89, annualProduction: 9200,
  monthlyProduction: [280,445,796,1182,1312,1328,1337,1182,954,622,332,249],
  selfConsumed: 2760, gridFeedIn: 6440, coveragePercent: 59,
  annualConsumption: 4645,
  lossBreakdown: { temperature: 5.6, cable: 2, inverter: 3, mismatch: 2, shading: 0.5, total: 13.1 },
};

const FINANCIAL_PROFITABLE: FinancialCalcOutput = {
  feedInRevenue: 523, savedOnBill: 856, annualSavings: 1379,
  installationCostRange: { base: 12500, min: 10625, max: 14375 },
  batteryCost: 0, totalCost: 12500,
  availableSubsidies: [{ id: "proklima-solar", name: "proKlima Solar", type: "grant", amount: 494, description: "", url: "" }],
  totalSubsidies: 494, subsidyNames: ["proKlima Solar: €494"],
  netCost: 12006, paybackYears: 8.7, roi25Years: 18500, npv: 11200,
  verdict: "profitable", score: 7,
};

const FINANCIAL_MARGINAL: FinancialCalcOutput = {
  ...FINANCIAL_PROFITABLE, verdict: "marginal", paybackYears: 14.5, score: 5,
};

const FINANCIAL_NOT_PROFITABLE: FinancialCalcOutput = {
  ...FINANCIAL_PROFITABLE, verdict: "not_profitable", paybackYears: 22, score: 2,
};

const USER_INPUT = {
  monthlyBill: 120, hasEV: false, wantsBattery: "unsure" as const, panelTier: "mid" as const,
};

function makeInput(
  overrides: Partial<RecommendationInput> = {}
): RecommendationInput {
  return {
    roof: ROOF_GOOD,
    solar: SOLAR,
    energy: ENERGY_GOOD,
    financial: FINANCIAL_PROFITABLE,
    userInput: USER_INPUT,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("generateRecommendations — output structure", () => {
  it("returns all required fields", () => {
    const r = generateRecommendations(makeInput());
    expect(r).toHaveProperty("mainRecommendation");
    expect(r).toHaveProperty("optimalSystemSize");
    expect(r).toHaveProperty("tiltAdvice");
    expect(r).toHaveProperty("batteryAdvice");
    expect(r).toHaveProperty("timingAdvice");
    expect(r).toHaveProperty("warnings");
    expect(Array.isArray(r.warnings)).toBe(true);
  });

  it("optimalSystemSize includes panel count and kWp", () => {
    const r = generateRecommendations(makeInput());
    expect(r.optimalSystemSize).toContain("23 Panels");
    expect(r.optimalSystemSize).toContain("kWp");
  });
});

describe("mainRecommendation — verdict rules", () => {
  it("profitable verdict produces positive recommendation", () => {
    const r = generateRecommendations(makeInput({ financial: FINANCIAL_PROFITABLE }));
    expect(r.mainRecommendation).toMatch(/Empfehlung|empfehlen|lohnt/i);
  });

  it("marginal verdict mentions multiple offers", () => {
    const r = generateRecommendations(makeInput({ financial: FINANCIAL_MARGINAL }));
    expect(r.mainRecommendation).toMatch(/Angebote|Installateur/i);
  });

  it("not_profitable verdict suggests alternatives", () => {
    const r = generateRecommendations(makeInput({ financial: FINANCIAL_NOT_PROFITABLE }));
    expect(r.mainRecommendation).toMatch(/kleinere|warten|kaum/i);
  });
});

describe("tiltAdvice — roof angle rules", () => {
  it("flat roof triggers Aufständerung advice", () => {
    const flatRoof: RoofAnalysis = { ...ROOF_GOOD, tilt: 2, tiltLossPercent: 22 };
    const r = generateRecommendations(makeInput({ roof: flatRoof }));
    expect(r.tiltAdvice).toMatch(/Aufständerung|flach/i);
  });

  it("optimal tilt gets positive confirmation", () => {
    const optimalRoof: RoofAnalysis = { ...ROOF_GOOD, tilt: 32, optimalTilt: 32, tiltLossPercent: 0.5 };
    const r = generateRecommendations(makeInput({ roof: optimalRoof }));
    expect(r.tiltAdvice).toMatch(/optimal|ideal/i);
  });

  it("high tilt loss with adjustable mount suggests fixing it", () => {
    const badRoof: RoofAnalysis = { ...ROOF_GOOD, tilt: 60, optimalTilt: 32, tiltLossPercent: 25, canAdjustTilt: true };
    const r = generateRecommendations(makeInput({ roof: badRoof }));
    expect(r.tiltAdvice).toMatch(/Halterung|Verlust|25%/i);
  });
});

describe("batteryAdvice — EV and coverage rules", () => {
  it("EV owner gets EV-specific battery advice", () => {
    const r = generateRecommendations(makeInput({ userInput: { ...USER_INPUT, hasEV: true } }));
    expect(r.batteryAdvice).toMatch(/Elektroauto|Laden/i);
  });

  it("low coverage triggers strong battery recommendation", () => {
    const lowCoverage = { ...ENERGY_GOOD, coveragePercent: 20 };
    const r = generateRecommendations(makeInput({ energy: lowCoverage }));
    expect(r.batteryAdvice).toMatch(/20%|Speicher|erhöhen/i);
  });

  it("high coverage gives optional battery advice", () => {
    const highCoverage = { ...ENERGY_GOOD, coveragePercent: 75 };
    const r = generateRecommendations(makeInput({ energy: highCoverage }));
    expect(r.batteryAdvice).toMatch(/optional|nicht zwingend|gut/i);
  });
});

describe("warnings — edge cases", () => {
  it("no warnings for ideal roof", () => {
    const r = generateRecommendations(makeInput());
    expect(r.warnings).toHaveLength(0);
  });

  it("strong shading generates warning", () => {
    const shadedRoof: RoofAnalysis = { ...ROOF_GOOD, shadingFactor: 0.40 };
    const r = generateRecommendations(makeInput({ roof: shadedRoof }));
    expect(r.warnings.some(w => w.match(/Beschattung|40%/i))).toBe(true);
  });

  it("small roof area generates warning", () => {
    const smallRoof: RoofAnalysis = { ...ROOF_GOOD, roofArea: 10 };
    const smallEnergy = { ...ENERGY_GOOD, panelCount: 5, systemSizeKwp: 2.15 };
    const r = generateRecommendations(makeInput({ roof: smallRoof, energy: smallEnergy }));
    expect(r.warnings.some(w => w.match(/Nutzfläche|10 m²/i))).toBe(true);
  });

  it("north-facing roof generates warning", () => {
    const northRoof: RoofAnalysis = { ...ROOF_GOOD, azimuth: 150 };
    const r = generateRecommendations(makeInput({ roof: northRoof }));
    expect(r.warnings.some(w => w.match(/Nördlich|Süd/i))).toBe(true);
  });

  it("low confidence data generates warning", () => {
    const lowConfRoof: RoofAnalysis = { ...ROOF_GOOD, confidence: "low" };
    const r = generateRecommendations(makeInput({ roof: lowConfRoof }));
    expect(r.warnings.some(w => w.match(/Sicherheit|Foto/i))).toBe(true);
  });

  it("multiple issues produce multiple warnings", () => {
    const badRoof: RoofAnalysis = {
      ...ROOF_GOOD, shadingFactor: 0.35, roofArea: 10, confidence: "low",
    };
    const r = generateRecommendations(makeInput({ roof: badRoof }));
    expect(r.warnings.length).toBeGreaterThanOrEqual(3);
  });
});
