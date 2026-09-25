import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker as LMarker, LeafletMouseEvent } from "leaflet";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { geoService } from "@/services/geo.service";
import { onlyDigits } from "@/lib/utils";

export type AddressValue = {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

export const emptyAddress: AddressValue = {
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  latitude: null,
  longitude: null,
};

const DEFAULT_CENTER: [number, number] = [-12.9777, -38.5016];

function buildQuery(v: AddressValue) {
  const parts = [
    v.street && v.number ? `${v.street}, ${v.number}` : v.street,
    v.neighborhood,
    v.city,
    v.state,
    v.postalCode,
    "Brasil",
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Address form with CEP autocomplete (ViaCEP), Nominatim geocoding and
 * a draggable Leaflet marker for fine adjustment.
 */
export function AddressMapPicker({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Lref = useRef<any>(null); // dynamically-loaded Leaflet module (CJS interop prevents precise typing)
  const [mapReady, setMapReady] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const fullMapEl = useRef<HTMLDivElement | null>(null);
  const fullMapRef = useRef<LMap | null>(null);
  const fullMarkerRef = useRef<LMarker | null>(null);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState("");

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const { address: a } = await geoService.reverseGeocode(lat, lon);
      const displayAddress = [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood,
        a.city || a.town || a.village,
        a.state_code || a.state,
      ]
        .filter(Boolean)
        .join(", ");
      setSelectedAddressLabel(displayAddress);
      onChange({
        ...value,
        latitude: lat,
        longitude: lon,
        street: value.street || a.road || a.pedestrian || a.footway || "",
        neighborhood: value.neighborhood || a.suburb || a.neighbourhood || a.quarter || "",
        city: value.city || a.city || a.town || a.village || "",
        state: value.state || a.state_code || a.state || "",
        postalCode: value.postalCode || a.postcode || "",
      });
    } catch {
      onChange({ ...value, latitude: lat, longitude: lon });
    }
  };

  // Stable ref so Leaflet event listeners (registered once on mount) always call the latest reverseGeocode,
  // which closes over the current value/onChange props instead of the stale mount-time versions.
  const reverseGeocodeRef = useRef(reverseGeocode);
  reverseGeocodeRef.current = reverseGeocode;

  // Init Leaflet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapEl.current || mapRef.current) return;
      Lref.current = L;
      const center: [number, number] =
        value.latitude && value.longitude ? [value.latitude, value.longitude] : DEFAULT_CENTER;
      const zoom = value.latitude ? 16 : 12;

      const map = L.map(mapEl.current).setView(center, zoom);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:var(--primary);border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker(center, { icon, draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        void reverseGeocodeRef.current(ll.lat, ll.lng);
      });
      map.on("click", (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        void reverseGeocodeRef.current(e.latlng.lat, e.latlng.lng);
      });
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng changes onto the marker
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!mapReady || !marker || !map) return;
    if (value.latitude && value.longitude) {
      const ll = [value.latitude, value.longitude] as [number, number];
      marker.setLatLng(ll);
      map.setView(ll, 16);
    }
  }, [value.latitude, value.longitude, mapReady]);

  const handleCepLookup = async (raw: string) => {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await geoService.lookupCep(cep);
      if (!data) {
        toast.error("CEP não encontrado");
        return;
      }
      const next: AddressValue = {
        ...value,
        postalCode: cep,
        street: data.street || value.street,
        neighborhood: data.neighborhood || value.neighborhood,
        city: data.city || value.city,
        state: data.state || value.state,
      };
      onChange(next);
      await geocode(next);
    } catch {
      toast.error("Falha ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const geocode = async (v: AddressValue = value) => {
    const q = buildQuery(v);
    if (!q) return;
    setGeocoding(true);
    try {
      const [match] = await geoService.searchAddress(q);
      if (!match) {
        toast.error("Endereço não localizado. Ajuste o marcador no mapa.");
        return;
      }
      onChange({ ...v, latitude: match.lat, longitude: match.lon });
    } catch {
      toast.error("Falha ao geocodificar");
    } finally {
      setGeocoding(false);
    }
  };

  const update = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });
  const openFullscreenMap = async () => {
    await geocode();
    setFullMapOpen(true);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        fullMarkerRef.current?.setLatLng([latitude, longitude]);
        fullMapRef.current?.setView([latitude, longitude], 17);
        void reverseGeocodeRef.current(latitude, longitude);
      },
      () => toast.error("Não foi possível obter sua localização."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Init fullscreen map when dialog opens
  useEffect(() => {
    if (!fullMapOpen || !fullMapEl.current || fullMapRef.current || !Lref.current) return;
    const L = Lref.current;
    const center: [number, number] =
      value.latitude && value.longitude ? [value.latitude, value.longitude] : DEFAULT_CENTER;

    const fullMap = L.map(fullMapEl.current).setView(center, value.latitude ? 17 : 13);
    fullMapRef.current = fullMap;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(fullMap);
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:9999px;background:var(--primary);border:4px solid white;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const fullMarker = L.marker(center, { icon, draggable: true }).addTo(fullMap);
    fullMarkerRef.current = fullMarker;
    fullMarker.on("dragend", () => {
      const ll = fullMarker.getLatLng();
      void reverseGeocodeRef.current(ll.lat, ll.lng);
    });
    fullMap.on("click", (e: LeafletMouseEvent) => {
      fullMarker.setLatLng(e.latlng);
      void reverseGeocodeRef.current(e.latlng.lat, e.latlng.lng);
    });
  }, [fullMapOpen, value.latitude, value.longitude]);

  // Cleanup fullscreen map on close
  useEffect(() => {
    if (!fullMapOpen) return;
    return () => {
      fullMapRef.current?.remove();
      fullMapRef.current = null;
      fullMarkerRef.current = null;
    };
  }, [fullMapOpen]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>CEP *</Label>
          <div className="flex gap-2">
            <Input
              value={value.postalCode}
              maxLength={9}
              onChange={(e) => update({ postalCode: e.target.value })}
              onBlur={(e) => handleCepLookup(e.target.value)}
              placeholder="00000-000"
            />
            {cepLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label>Número *</Label>
          <Input
            value={value.number}
            onChange={(e) => update({ number: e.target.value })}
            placeholder="123"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Rua *</Label>
        <Input
          value={value.street}
          onChange={(e) => update({ street: e.target.value })}
          placeholder="Av. Sete de Setembro"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Bairro *</Label>
          <Input
            value={value.neighborhood}
            onChange={(e) => update({ neighborhood: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Complemento</Label>
          <Input
            value={value.complement}
            onChange={(e) => update({ complement: e.target.value })}
            placeholder="Sala 2"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Cidade *</Label>
          <Input value={value.city} onChange={(e) => update({ city: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>UF *</Label>
          <Input
            value={value.state}
            maxLength={2}
            onChange={(e) => update({ state: e.target.value.toUpperCase() })}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        onClick={openFullscreenMap}
        disabled={geocoding}
      >
        {geocoding ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Search className="mr-2 h-4 w-4" />
        )}
        Localizar no mapa
      </Button>

      <div className="space-y-1">
        <Label className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> Ajuste fino (arraste o marcador)
        </Label>
        <div
          ref={mapEl}
          className="h-40 w-full overflow-hidden rounded-lg border bg-muted md:h-52"
        />
        {value.latitude && value.longitude ? (
          <p className="text-[11px] text-muted-foreground">
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </p>
        ) : (
          <p className="text-[11px] text-warning">
            Localização ainda não definida. Preencha o endereço e clique em "Localizar no mapa".
          </p>
        )}
      </div>
      <Dialog open={fullMapOpen} onOpenChange={setFullMapOpen}>
        <DialogContent className="z-[999] h-[100dvh] w-screen max-w-none gap-0 rounded-none p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b bg-card px-4 py-3">
              <Button type="button" variant="ghost" onClick={() => setFullMapOpen(false)}>
                Voltar
              </Button>
              <Button type="button" variant="outline" onClick={useCurrentLocation}>
                Usar minha localização
              </Button>
            </div>
            <div ref={fullMapEl} className="min-h-0 flex-1" />
            <div className="space-y-3 border-t bg-card p-4">
              <p className="text-sm text-muted-foreground">
                {selectedAddressLabel || "Ajuste o marcador para confirmar a localização."}
              </p>
              <Button type="button" className="h-12 w-full" onClick={() => setFullMapOpen(false)}>
                Confirmar localização
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
