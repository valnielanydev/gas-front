import { ChevronRight, Search } from "lucide-react";
import type { GeoError } from "@/hooks/useGeolocation";

interface Props {
  address: string;
  geoError: GeoError | null;
  onClick: () => void;
}

export function DeliveryAddressButton({ address, geoError, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-[2rem] border border-primary/10 bg-card/95 p-5 text-left shadow-xl shadow-primary/5 ring-1 ring-white/40 transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <Search className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-black leading-tight">Para onde entregar?</div>
        <div className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
          {address ||
            (geoError === "denied"
              ? "Toque para informar seu endereço"
              : geoError
                ? "GPS indisponível — toque para informar seu endereço"
                : "Use sua localização ou busque um endereço")}
        </div>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
