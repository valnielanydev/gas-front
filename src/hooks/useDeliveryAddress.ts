import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AddressConfirmResult } from "@/components/customer/AddressDrawer";
import type { GeoError } from "@/hooks/useGeolocation";
import { geoService } from "@/services/geo.service";

export type LastAddress = { address: string; lat: number | null; lng: number | null };

interface Args {
  pos: [number, number] | null;
  setPos: (pos: [number, number]) => void;
  setGeoError: (error: GeoError | null) => void;
}

/**
 * Delivery address typed or picked by the customer. Pre-fills it from the GPS position
 * (reverse geocoded) until the customer chooses one themselves.
 */
export function useDeliveryAddress({ pos, setPos, setGeoError }: Args) {
  const [address, setAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);

  // Reverse-geocode the GPS position into a human-readable address (once, before user touches it)
  useEffect(() => {
    if (!pos || addressTouched || address.trim()) return;
    (async () => {
      try {
        const { displayName } = await geoService.reverseGeocode(pos[0], pos[1]);
        if (displayName && !addressTouched) setAddress(displayName);
      } catch {
        // noop
      }
    })();
  }, [pos, addressTouched]);

  const applyLastAddress = (lastAddress: LastAddress) => {
    setAddress(lastAddress.address);
    setAddressTouched(true);
    if (lastAddress.lat != null && lastAddress.lng != null) {
      setPos([lastAddress.lat, lastAddress.lng]);
      setGeoError(null);
    }
    toast.success("Endereço reutilizado. Escolha uma revendedora para continuar.");
  };

  const confirmAddress = ({
    address: confirmedAddress,
    pos: confirmedPos,
  }: AddressConfirmResult) => {
    setAddress(confirmedAddress);
    setAddressTouched(true);
    setGeoError(null);
    if (confirmedPos) setPos(confirmedPos);
  };

  return { address, applyLastAddress, confirmAddress };
}
