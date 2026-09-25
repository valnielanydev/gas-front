import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { fmtMoney } from "@/lib/constants";
import { estimateEtaMinutes, formatEta } from "@/lib/distance";
import type { NearbyReseller, Product } from "@/types/reseller";

interface Props {
  reseller: NearbyReseller | null;
  products: Product[] | undefined;
  loading: boolean;
  error: string | null;
  hasActiveOrder: boolean;
  onClose: () => void;
  onOrder: (product: Product) => void;
}

export function ResellerProductsDrawer({
  reseller,
  products,
  loading,
  error,
  hasActiveOrder,
  onClose,
  onOrder,
}: Props) {
  return (
    <Drawer open={!!reseller} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="z-[500] flex max-h-[85dvh] flex-col">
        {reseller && (
          <>
            <DrawerHeader className="shrink-0 text-left">
              <DrawerTitle>{reseller.name}</DrawerTitle>
              <DrawerDescription>
                {reseller.city ?? "—"} • {reseller.distance_km} km •{" "}
                {formatEta(estimateEtaMinutes(Number(reseller.distance_km)))}
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-6">
              {loading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              {products?.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sem produtos disponíveis no momento.
                </p>
              )}
              {!!error && (
                <p className="py-3 text-center text-sm text-destructive">
                  Falha ao carregar produtos: {error}
                </p>
              )}
              {products?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-base font-bold text-primary">
                        {fmtMoney(Number(p.price))}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onOrder(p)}>
                    {hasActiveOrder ? "Ver pedido ativo" : "Pedir"}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
