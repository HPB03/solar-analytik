export interface PVGISParams {
  lat: number;
  lng: number;
  tilt: number;
  azimuth: number; // PVGIS uses: 0=south, 90=west, -90=east
}

export interface PVGISMonthlyOutput {
  month: number;
  E_d: number;  // kWh/day
  E_m: number;  // kWh/month
  H_i_d: number; // irradiance kWh/m²/day
  H_i_m: number; // irradiance kWh/m²/month
  T2m: number;  // avg temperature °C
}

export interface PVGISResponse {
  outputs: {
    monthly: {
      fixed: PVGISMonthlyOutput[];
    };
    totals: {
      fixed: {
        E_d: number;
        E_m: number;
        E_y: number;  // annual kWh/kWp
        H_i_d: number;
        H_i_m: number;
        H_i_y: number; // annual irradiance kWh/m²
      };
    };
  };
}
