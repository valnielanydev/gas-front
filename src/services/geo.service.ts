import type { Coords } from "@/types/common";
import type {
  CepAddress,
  DrivingRoute,
  GeocodeResult,
  NominatimAddress,
  ReverseGeocodeResult,
  SearchAddressOptions,
} from "@/types/geo";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const VIACEP_URL = "https://viacep.com.br/ws";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/** Headers required by Nominatim's usage policy. User-Agent is effective in SSR; browsers send Referer automatically. */
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "VaptGas/1.0",
} as const;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return (await res.json()) as T;
}

export const geoService = {
  reverseGeocode: async (lat: number, lon: number): Promise<ReverseGeocodeResult> => {
    const params = new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lon),
      addressdetails: "1",
    });
    const data = await getJson<{ display_name?: string; address?: NominatimAddress }>(
      `${NOMINATIM_URL}/reverse?${params}`,
      { headers: NOMINATIM_HEADERS },
    );
    return { displayName: data.display_name ?? null, address: data.address ?? {} };
  },

  searchAddress: async (
    query: string,
    { limit = 1, countryCodes = "br", near }: SearchAddressOptions = {},
  ): Promise<GeocodeResult[]> => {
    const params = new URLSearchParams({ format: "json", limit: String(limit), q: query });
    if (countryCodes) params.set("countrycodes", countryCodes);
    if (near) {
      // ~0.5deg viewbox around the user (~55km) — bias only, not strict
      const [lat, lng] = near;
      const d = 0.5;
      params.set("viewbox", `${lng - d},${lat + d},${lng + d},${lat - d}`);
      params.set("bounded", "0");
    }
    const rows = await getJson<Array<{ display_name: string; lat: string; lon: string }>>(
      `${NOMINATIM_URL}/search?${params}`,
      { headers: NOMINATIM_HEADERS },
    );
    return rows.map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    }));
  },

  /** Returns `null` when the CEP does not exist. */
  lookupCep: async (cep: string): Promise<CepAddress | null> => {
    const data = await getJson<{
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    }>(`${VIACEP_URL}/${cep}/json/`);
    if (data.erro) return null;
    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  },

  /** Returns `null` when OSRM finds no route between the points. */
  drivingRoute: async (from: Coords, to: Coords): Promise<DrivingRoute | null> => {
    const data = await getJson<{
      routes?: Array<{
        geometry: { coordinates: [number, number][] };
        distance: number;
        duration: number;
      }>;
    }>(`${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: Number(route.distance) / 1000,
      durationMin: Number(route.duration) / 60,
    };
  },
};
