// M1 — Geocoding
export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string;
  isSupported: boolean;
}

export interface MapboxSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{ id: string; text: string }>;
}

// M2 — Roof Analysis
export interface RoofAnalysis {
  roofArea: number;
  tilt: number;
  azimuth: number;
  shadingFactor: number;
  optimalTilt: number;
  tiltLossPercent: number;
  canAdjustTilt: boolean;
  confidence: "high" | "medium" | "low";
  needsPhoto: boolean;
  satelliteImageUrl: string;
}

// M3 — Solar Irradiance
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  cloudCover: number;
  description: string;
  icon: string;
  windSpeed: number;
  city: string;
}

export interface SolarIrradiance {
  monthlyIrradiance: number[];
  annualIrradiance: number;
  sunHoursPerYear: number;
  avgTemperature: number[];
  currentWeather?: CurrentWeather;
}

// M4 — Energy Production
export type PanelTier = "budget" | "mid" | "premium";

export interface EnergyProduction {
  annualProduction: number;
  monthlyProduction: number[];
  panelCount: number;
  systemSize: number;
  selfConsumptionRate: number;
  gridFeedIn: number;
  coveragePercent: number;
}

// M5 — Financial
export interface Subsidy {
  name: string;
  amount: number;
  description: string;
  url?: string;
}

export interface FinancialSummary {
  installationCost: { min: number; max: number };
  annualSavings: number;
  paybackYears: number;
  roi25Years: number;
  feedInRevenue: number;
  availableSubsidies: Subsidy[];
  netCostAfterSubsidies: number;
  verdict: "profitable" | "marginal" | "not_profitable";
  score: number;
}

// M6 — Recommendations
export interface Recommendations {
  mainRecommendation: string;
  optimalSystemSize: string;
  tiltAdvice: string;
  batteryAdvice: string;
  timingAdvice: string;
  warnings: string[];
}

// User questionnaire input
export interface UserQuestions {
  buildingType: "haus" | "reihenhaus" | "wohnung";
  monthlyBill: number;
  hasEV: boolean;
  hasHeatPump: boolean;
  wantsBattery: "yes" | "no" | "unsure";
  panelTier: PanelTier;
}

// Full calculation session
export interface CalculationSession {
  address: GeocodeResult;
  questions?: UserQuestions;
  roof?: RoofAnalysis;
  solar?: SolarIrradiance;
  energy?: EnergyProduction;
  financial?: FinancialSummary;
  recommendations?: Recommendations;
}
