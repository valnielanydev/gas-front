import { Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDriverHistory } from "@/queries/reseller.queries";
import type { ResellerDriver } from "@/types/driver";

export function DriverHistoryDialog({
  driver,
  onClose,
}: {
  driver: ResellerDriver | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useDriverHistory(driver?.id);

  return (
    <Dialog open={!!driver} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{driver?.full_name}</DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {Number(driver?.rating ?? 0).toFixed(1)}
            </span>
            <span>·</span>
            <span>{driver?.total_deliveries} entregas</span>
            {driver?.phone && (
              <>
                <span>·</span>
                <span>{driver.phone}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Últimas avaliações</h3>
              {data?.ratings.length ? (
                <ul className="space-y-2">
                  {data.ratings.map((r, i) => (
                    <li key={i} className="rounded-md border border-border p-3 text-sm">
                      <div className="flex items-center gap-1 font-medium">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star key={idx} className="h-3 w-3 fill-warning text-warning" />
                        ))}
                      </div>
                      {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sem avaliações ainda.</p>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Últimos pedidos</h3>
              {data?.orders.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm">
                          {new Date(o.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          R$ {Number(o.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum pedido atribuído.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
