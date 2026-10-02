import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeactivateDriverDialog } from "@/components/reseller/DeactivateDriverDialog";
import { DriverEditDialog } from "@/components/reseller/DriverEditDialog";
import { DriverHistoryDialog } from "@/components/reseller/DriverHistoryDialog";
import { DriverInviteCard } from "@/components/reseller/DriverInviteCard";
import { DriversTable } from "@/components/reseller/DriversTable";
import { RemoveDriverDialog } from "@/components/reseller/RemoveDriverDialog";
import { useResellerDrivers, useUpdateDriverStatus } from "@/queries/reseller.queries";
import type { DriverApprovalStatus, ResellerDriver } from "@/types/driver";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/app/drivers")({ component: DriversPage });

function DriversPage() {
  const { resellerId } = useAuth();

  const [editing, setEditing] = useState<ResellerDriver | null>(null);
  const [removing, setRemoving] = useState<ResellerDriver | null>(null);
  const [historyOf, setHistoryOf] = useState<ResellerDriver | null>(null);
  const [deactivating, setDeactivating] = useState<ResellerDriver | null>(null);
  const [tab, setTab] = useState<DriverApprovalStatus>("pending");

  const { data: drivers, isLoading } = useResellerDrivers(resellerId);

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, inactive: 0 };
    drivers?.forEach((d) => {
      c[d.approval_status]++;
    });
    return c;
  }, [drivers]);

  const filtered = useMemo(
    () => drivers?.filter((d) => d.approval_status === tab) ?? [],
    [drivers, tab],
  );

  const setStatus = useUpdateDriverStatus(resellerId, {
    onSuccess: (_data, variables) => {
      if (variables.status !== "inactive") toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!resellerId) return <p className="text-muted-foreground">Sem revendedora vinculada.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Motoristas</h1>
        <p className="text-sm text-muted-foreground">
          Compartilhe seu código de cadastro com motoristas e aprove-os para começarem a receber
          pedidos.
        </p>
      </div>

      <DriverInviteCard />

      <Tabs value={tab} onValueChange={(v) => setTab(v as DriverApprovalStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({counts.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({counts.inactive})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="rounded-lg border bg-card">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center">
                <Truck className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tab === "pending"
                    ? "Nenhum motorista aguardando aprovação."
                    : tab === "active"
                      ? "Nenhum motorista ativo."
                      : "Nenhum motorista inativo."}
                </p>
              </div>
            ) : (
              <DriversTable
                drivers={filtered}
                tab={tab}
                statusPending={setStatus.isPending}
                onSetStatus={(d, status) => setStatus.mutate({ d, status })}
                onDeactivate={setDeactivating}
                onShowHistory={setHistoryOf}
                onEdit={setEditing}
                onRemove={setRemoving}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DriverEditDialog editing={editing} onClose={() => setEditing(null)} />
      <RemoveDriverDialog driver={removing} onClose={() => setRemoving(null)} />
      <DriverHistoryDialog driver={historyOf} onClose={() => setHistoryOf(null)} />

      <DeactivateDriverDialog
        driver={deactivating}
        pending={setStatus.isPending}
        onClose={() => setDeactivating(null)}
        onConfirm={() => {
          if (!deactivating) return;
          setStatus.mutate(
            { d: deactivating, status: "inactive" },
            {
              onSuccess: () => {
                toast.success("Motorista desativado com sucesso. Ele será notificado.");
                setDeactivating(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
