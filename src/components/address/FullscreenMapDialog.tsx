import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DEFAULT_MAP_CENTER, usePickerMap } from "@/hooks/usePickerMap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Position to start from; the default city center when unknown. */
  initial: [number, number] | null;
  /** Human-readable address of the picked point, shown under the map. */
  label: string;
  onPick: (lat: number, lng: number) => void;
}

/** Full-screen map to pick the delivery point by dragging, clicking or using the GPS. */
export function FullscreenMapDialog({ open, onOpenChange, initial, label, onPick }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const { mapRef, markerRef } = usePickerMap(mapEl, {
    enabled: open,
    center: initial ?? DEFAULT_MAP_CENTER,
    zoom: initial ? 17 : 13,
    markerSize: 30,
    onPick,
  });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        markerRef.current?.setLatLng([latitude, longitude]);
        mapRef.current?.setView([latitude, longitude], 17);
        onPick(latitude, longitude);
      },
      () => toast.error("Não foi possível obter sua localização."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[999] h-[100dvh] w-screen max-w-none gap-0 rounded-none p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b bg-card px-4 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Voltar
            </Button>
            <Button type="button" variant="outline" onClick={useCurrentLocation}>
              Usar minha localização
            </Button>
          </div>
          <div ref={mapEl} className="min-h-0 flex-1" />
          <div className="space-y-3 border-t bg-card p-4">
            <p className="text-sm text-muted-foreground">
              {label || "Ajuste o marcador para confirmar a localização."}
            </p>
            <Button type="button" className="h-12 w-full" onClick={() => onOpenChange(false)}>
              Confirmar localização
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
