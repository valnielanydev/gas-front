import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { emptyAddress } from "@/components/address/AddressMapPicker";
import type { AddressValue } from "@/components/address/AddressMapPicker";
import { geoService } from "@/services/geo.service";

const AddressMapPicker = lazy(() =>
  import("@/components/address/AddressMapPicker").then((m) => ({ default: m.AddressMapPicker })),
);

function AddressMapPickerFallback() {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-3xl border bg-muted/40 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
      Carregando mapa...
    </div>
  );
}

export type AddressConfirmResult = {
  address: string;
  pos: [number, number] | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  near: [number, number] | null;
  onConfirm: (result: AddressConfirmResult) => void;
}

function buildPickerLabel(v: AddressValue): string {
  return [
    v.street && v.number ? `${v.street}, ${v.number}` : v.street,
    v.neighborhood,
    v.city && v.state ? `${v.city} - ${v.state}` : v.city || v.state,
    v.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function AddressDrawer({ open, onOpenChange, near, onConfirm }: Props) {
  const [manualAddress, setManualAddress] = useState("");
  const [picker, setPicker] = useState<AddressValue>(emptyAddress);
  const [geocoding, setGeocoding] = useState(false);

  // Reset and initialize whenever the drawer opens.
  // `near` is intentionally excluded from deps — we only want to seed once on open,
  // not re-center the map every time the parent's GPS position ticks.
  // `navigator.geolocation` is a stable browser global, never reassigned, safe to omit.
  useEffect(() => {
    if (!open) {
      setManualAddress("");
      setPicker(emptyAddress);
      setGeocoding(false);
      return;
    }
    if (near) setPicker({ ...emptyAddress, latitude: near[0], longitude: near[1] });
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setPicker((prev) => ({
          ...prev,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        })),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = (result: AddressConfirmResult) => {
    onConfirm(result);
    onOpenChange(false);
  };

  const geocodeText = async (query = manualAddress) => {
    if (!query.trim()) return;
    setGeocoding(true);
    try {
      const [match] = await geoService.searchAddress(query, { countryCodes: null });
      if (!match) {
        toast.error("Endereço não encontrado");
        return;
      }
      confirm({ address: match.displayName, pos: [match.lat, match.lon] });
    } catch {
      toast.error("Falha ao buscar endereço");
    } finally {
      setGeocoding(false);
    }
  };

  const confirmPicker = () => {
    const label = buildPickerLabel(picker) || manualAddress.trim();
    if (!label) {
      toast.error("Informe ou selecione um endereço de entrega");
      return;
    }
    if (picker.latitude != null && picker.longitude != null) {
      confirm({ address: label, pos: [picker.latitude, picker.longitude] });
      return;
    }
    void geocodeText(label);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="z-[600] flex h-[92dvh] max-h-[92dvh] flex-col">
        <DrawerHeader className="shrink-0 text-left">
          <DrawerTitle>Onde entregar?</DrawerTitle>
          <DrawerDescription>
            Busque um endereço ou toque no mapa para ajustar o local de entrega.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            <AddressAutocomplete
              value={manualAddress}
              onChange={setManualAddress}
              onSelect={(s) => confirm({ address: s.display_name, pos: [s.lat, s.lon] })}
              near={near}
              autoFocus
              placeholder="Rua, bairro, cidade"
            />
            <p className="text-[11px] text-muted-foreground">
              Selecione uma sugestão, busque manualmente ou ajuste o ponto no mapa.
            </p>
          </div>
          <Suspense fallback={<AddressMapPickerFallback />}>
            <AddressMapPicker value={picker} onChange={setPicker} />
          </Suspense>
        </div>
        <DrawerFooter className="shrink-0 border-t bg-background">
          <Button onClick={confirmPicker} disabled={geocoding} className="h-12 w-full">
            {geocoding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Usar este endereço
          </Button>
          <Button
            onClick={() => void geocodeText()}
            disabled={geocoding || !manualAddress.trim()}
            variant="outline"
            className="w-full"
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar texto digitado
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
