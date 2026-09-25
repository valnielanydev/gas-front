import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { ApiError } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { customerService } from "@/services/customer.service";
import type { BlockedDriver } from "@/types/customer";

export const Route = createFileRoute("/customer/blocked-drivers")({
  component: BlockedDriversPage,
});

function BlockedDriversPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BlockedDriver[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await customerService.listBlockedDrivers();
      setRows(data ?? []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar motoristas bloqueados");
    } finally {
      setLoading(false);
    }
  };

  const unblock = async (driverId: string) => {
    try {
      await customerService.unblockDriver(driverId);
      toast.success("Motorista desbloqueado.");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao desbloquear motorista");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/customer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">Motoristas bloqueados</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !rows.length ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhum motorista bloqueado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.driver_id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{row.driver_name ?? "Motorista"}</p>
                  <p className="text-xs text-muted-foreground">
                    Bloqueado em {new Date(row.blocked_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" /> Avaliação média disponível no acompanhamento do
                    pedido
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => unblock(row.driver_id)}>
                  🔓 Desbloquear
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
