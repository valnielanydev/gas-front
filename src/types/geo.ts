/** Raw `address` object returned by Nominatim when `addressdetails=1`. */
export type NominatimAddress = Partial<
  Record<
    | "road"
    | "pedestrian"
    | "footway"
    | "suburb"
    | "neighbourhood"
    | "quarter"
    | "city"
    | "town"
    | "village"
    | "state"
    | "state_code"
    | "postcode",
    string
  >
>;

export interface ReverseGeocodeResult {
  displayName: string | null;
  address: NominatimAddress;
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
}

export interface SearchAddressOptions {
  limit?: number;
  /** ISO country codes; `null` searches worldwide. Defaults to Brazil. */
  countryCodes?: string | null;
  /** Biases results towards this `[lat, lng]` without restricting them. */
  near?: [number, number] | null;
  signal?: AbortSignal;
}

export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface DrivingRoute {
  /** Route geometry as `[lat, lng]` pairs, ready for Leaflet. */
  path: [number, number][];
  distanceKm: number;
  durationMin: number;
}
