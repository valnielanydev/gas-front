import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NearbyResellerCard } from "@/components/customer/NearbyResellerCard";
import type { GeoError } from "@/hooks/useGeolocation";
import type { NearbyReseller } from "@/types/reseller";

interface Props {
  resellers: NearbyReseller[];
  loading: boolean;
  visibleCount: number;
  /** Infinite-scroll sentinel from `useNearbyResellers`. */
  sentinelRef: RefObject<HTMLDivElement | null>;
  geoError: GeoError | null;
  onSelect: (reseller: NearbyReseller) => void;
}

export function NearbyResellersSection({
  resellers,
  loading,
  visibleCount,
  sentinelRef,
  geoError,
  onSelect,
}: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col pt-1">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight">Revendedoras próximas</h2>
          <p className="text-sm text-muted-foreground">Ordenadas da menor para a maior distância</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {loading
            ? "Buscando"
            : resellers.length
              ? `${resellers.length} opções`
              : geoError
                ? "Endereço"
                : "0 opções"}
        </span>
      </div>

      <div className="space-y-3 pb-2">
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[132px] animate-pulse rounded-[1.75rem] border bg-card/70 p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-2/3 rounded-full bg-muted" />
                  <div className="h-3 w-full rounded-full bg-muted" />
                  <div className="h-3 w-3/4 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}

        {!loading && resellers.length === 0 && (
          <Card className="rounded-[1.75rem] border-dashed bg-card/80">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {geoError
                ? "Informe seu endereço para ver revendedoras próximas."
                : "Nenhuma revendedora ativa por perto."}
            </CardContent>
          </Card>
        )}

        {!loading &&
          resellers
            .slice(0, visibleCount)
            .map((r, index) => (
              <NearbyResellerCard
                key={r.id}
                reseller={r}
                closest={index === 0}
                onClick={() => onSelect(r)}
              />
            ))}

        {!loading && visibleCount < resellers.length && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </section>
  );
}
