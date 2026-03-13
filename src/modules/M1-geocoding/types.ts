export interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  place_type: string[];
}

export interface MapboxGeocodeResponse {
  features: MapboxFeature[];
}
