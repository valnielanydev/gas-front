import { CheckCircle2, MapPin, Navigation, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/constants";
import { estimateEtaMinutes, formatEta } from "@/lib/distance";
import type { NearbyReseller } from "@/types/reseller";

interface Props {
  reseller: NearbyReseller;
  /** Shows the "Mais perto" badge. */
  closest: boolean;
  onClick: () => void;
}

export function NearbyResellerCard({ reseller: r, closest, onClick }: Props) {
  const distance = Number(r.distance_km);
  const eta = estimateEtaMinutes(distance);
  return (
    <button
      aria-label={`Ver produtos de ${r.name}`}
      onClick={onClick}
      className="group w-full rounded-[1.75rem] border bg-card p-4 text-left shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="line-clamp-1 text-base font-black leading-tight">{r.name}</span>
                {closest && (
                  <Badge variant="secondary" className="shrink-0 rounded-full text-[10px]">
                    Mais perto
                  </Badge>
                )}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Disponível
              </div>
            </div>
            {r.min_price != null && (
              <div className="shrink-0 rounded-2xl bg-primary/10 px-3 py-2 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                  a partir de
                </div>
                <div className="text-base font-black text-primary">
                  {fmtMoney(Number(r.min_price))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl bg-muted/55 px-2.5 py-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                Distância
              </span>
              <strong className="mt-0.5 block text-sm">{distance.toFixed(1)} km</strong>
            </div>
            <div className="rounded-2xl bg-muted/55 px-2.5 py-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-3.5 w-3.5" />
                Tempo
              </span>
              <strong className="mt-0.5 block text-sm">{formatEta(eta)}</strong>
            </div>
            <div className="min-w-0 rounded-2xl bg-muted/55 px-2.5 py-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Cidade
              </span>
              <strong className="mt-0.5 block truncate text-sm">{r.city ?? "—"}</strong>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
