// Region Hannover bounding box
export const HANNOVER_BOUNDS = {
  minLng: 9.1,
  maxLng: 10.3,
  minLat: 52.1,
  maxLat: 52.7,
};

// Mapbox proximity point (Hannover city center)
export const HANNOVER_CENTER = {
  lng: 9.7320,
  lat: 52.3759,
};

// Optimal tilt for Hannover latitude (~52.37°N)
export const HANNOVER_OPTIMAL_TILT = 32; // degrees

// PVGIS fallback values for Hannover (if API unavailable)
export const HANNOVER_FALLBACK_SOLAR = {
  monthlyIrradiance: [18, 32, 68, 107, 143, 151, 149, 128, 89, 47, 21, 13],
  annualIrradiance: 966,
  sunHoursPerYear: 1700,
  avgTemperature: [1.2, 1.8, 5.5, 9.8, 14.5, 17.6, 19.4, 19.0, 14.8, 10.1, 5.2, 2.0],
};

// System losses (%)
export const SYSTEM_LOSSES = {
  temperature: 0.04,   // 4% temperature coefficient losses
  cable:        0.02,  // 2% cable losses
  inverter:     0.04,  // 4% inverter losses
  degradation:  0.005, // 0.5% annual degradation
  mismatch:     0.02,  // 2% mismatch losses
};

// Feed-in tariff (Einspeisevergütung) 2024 Germany (€/kWh)
export const FEED_IN_TARIFF = {
  upTo10kWp:   0.0812,
  upTo40kWp:   0.0790,
};

// Electricity price Hannover 2024
export const ELECTRICITY_PRICE_PER_KWH = 0.31; // €/kWh

// Average household consumption Germany
export const AVG_HOUSEHOLD_CONSUMPTION_KWH = 3500;

// Panel dimensions (m²) per panel
export const PANEL_SIZE_M2 = 1.7;

// Battery cost per kWh
export const BATTERY_COST_PER_KWH = 800; // €

// Typical battery size
export const TYPICAL_BATTERY_KWH = 7.5;

// Self consumption rate with/without battery
export const SELF_CONSUMPTION_WITHOUT_BATTERY = 0.30;
export const SELF_CONSUMPTION_WITH_BATTERY = 0.70;
