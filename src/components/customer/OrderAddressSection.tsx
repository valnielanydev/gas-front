import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AddressAutocomplete,
  type AddressSuggestion,
} from "@/components/address/AddressAutocomplete";
import type { AddressValue } from "@/types/address";

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

export type DeliveryMode = "current" | "custom";

interface Props {
  deliveryMode: DeliveryMode;
  onDeliveryModeChange: (mode: DeliveryMode) => void;
  /** Free-text address, used with the "current location" mode. */
  address: string;
  onAddressChange: (address: string) => void;
  /** A suggestion was picked: its coordinates are the delivery point. */
  onAddressSelect: (suggestion: AddressSuggestion) => void;
  near: [number, number] | null;
  /** Structured address picked on the map, used with the "custom" mode. */
  customAddress: AddressValue;
  onCustomAddressChange: (address: AddressValue) => void;
}

export function OrderAddressSection({
  deliveryMode,
  onDeliveryModeChange,
  address,
  onAddressChange,
  onAddressSelect,
  near,
  customAddress,
  onCustomAddressChange,
}: Props) {
  return (
    <section className="space-y-2 rounded-xl border p-3">
      <h3 className="text-sm font-semibold">1. Endereço</h3>
      <p className="text-xs font-medium text-muted-foreground">Endereço de entrega *</p>
      <div className="mb-2 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant={deliveryMode === "current" ? "default" : "outline"}
          onClick={() => onDeliveryModeChange("current")}
        >
          Minha localização atual
        </Button>
        <Button
          type="button"
          size="sm"
          variant={deliveryMode === "custom" ? "default" : "outline"}
          onClick={() => onDeliveryModeChange("custom")}
        >
          Outro local
        </Button>
      </div>
      {deliveryMode === "current" ? (
        <AddressAutocomplete
          value={address}
          onChange={onAddressChange}
          onSelect={onAddressSelect}
          near={near}
          placeholder="Rua, número, bairro"
        />
      ) : (
        <Suspense fallback={<AddressMapPickerFallback />}>
          <AddressMapPicker value={customAddress} onChange={onCustomAddressChange} />
        </Suspense>
      )}
    </section>
  );
}
