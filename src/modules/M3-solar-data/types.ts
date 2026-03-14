export interface PVGISParams {
  lat: number;
  lng: number;
  tilt: number;
  azimuth: number; // PVGIS convention: 0=south, 90=west, -90=east
}

export interface PVGISMonthlyOutput {
  month: number;
  E_d: number;    // average daily production (kWh/kWp/day)
  E_m: number;    // average monthly production (kWh/kWp/month)
  "H(i)_d": number; // daily in-plane irradiance (kWh/m²/day)
  "H(i)_m": number; // monthly in-plane irradiance (kWh/m²/month)
  SD_m: number;   // mean daily sunshine duration (h/day)
}

export interface PVGISTotals {
  E_d: number;
  E_m: number;
  E_y: number;      // annual specific yield (kWh/kWp/year)
  "H(i)_d": number;
  "H(i)_m": number;
  "H(i)_y": number; // annual in-plane irradiance (kWh/m²/year)
  SD_m: number;
  SD_y: number;     // annual mean daily sunshine duration
}

export interface PVGISResponse {
  outputs: {
    monthly: {
      fixed: PVGISMonthlyOutput[];
    };
    totals: {
      fixed: PVGISTotals;
    };
  };
}

// Current weather from OpenWeather API
export interface CurrentWeather {
  temperature: number;    // °C
  feelsLike: number;      // °C
  cloudCover: number;     // 0–100 %
  description: string;    // e.g. "overcast clouds"
  icon: string;           // OpenWeather icon code, e.g. "04d"
  windSpeed: number;      // m/s
  city: string;
}
