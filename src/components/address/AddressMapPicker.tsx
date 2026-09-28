import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddressFields } from "@/components/address/AddressFields";
import { FullscreenMapDialog } from "@/components/address/FullscreenMapDialog";
import { DEFAULT_MAP_CENTER, usePickerMap } from "@/hooks/usePickerMap";
import { buildGeocodeQuery } from "@/lib/address";
import { onlyDigits } from "@/lib/utils";
import { geoService } from "@/services/geo.service";
import type { AddressValue } from "@/types/address";

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
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState("");
  const position: [number, number] | null =
    value.latitude && value.longitude ? [value.latitude, value.longitude] : null;

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

  const {
    mapRef,
    markerRef,
    ready: mapReady,
  } = usePickerMap(mapEl, {
    enabled: true,
    center: position ?? DEFAULT_MAP_CENTER,
    zoom: position ? 16 : 12,
    markerSize: 28,
    onPick: (lat, lng) => void reverseGeocode(lat, lng),
  });

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
  }, [value.latitude, value.longitude, mapReady, mapRef, markerRef]);

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
    const q = buildGeocodeQuery(v);
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

  return (
    <div className="space-y-3">
      <AddressFields
        value={value}
        update={update}
        onCepBlur={handleCepLookup}
        cepLoading={cepLoading}
      />

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
      <FullscreenMapDialog
        open={fullMapOpen}
        onOpenChange={setFullMapOpen}
        initial={position}
        label={selectedAddressLabel}
        onPick={(lat, lng) => void reverseGeocode(lat, lng)}
      />
    </div>
  );
}
