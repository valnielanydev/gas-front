import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Truck,
  Star,
  Pencil,
  Trash2,
  History,
  Copy,
  Check,
  X,
  Power,
  PowerOff,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/app/drivers")({ component: DriversPage });

type ApprovalStatus = "pending" | "active" | "inactive";

interface Driver {
  id: string;
  user_id: string;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  document: string | null;
  status: string;
  is_active: boolean;
  approval_status: ApprovalStatus;
  rating: number | null;
  total_deliveries: number;
  created_at: string;
  full_name: string | null;
  phone: string | null;
}

function DriversPage() {
  const { resellerId } = useAuth();
  const qc = useQueryClient();

  const [editing, setEditing] = useState<Driver | null>(null);
  const [removing, setRemoving] = useState<Driver | null>(null);
  const [historyOf, setHistoryOf] = useState<Driver | null>(null);
  const [deactivating, setDeactivating] = useState<Driver | null>(null);
  const [tab, setTab] = useState<ApprovalStatus>("pending");

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers", resellerId],
    enabled: !!resellerId,
    queryFn: () => api.get<Driver[]>(`/resellers/${resellerId}/drivers`),
  });

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

  const setStatus = useMutation({
    mutationFn: ({ d, status }: { d: Driver; status: ApprovalStatus }) =>
      api.patch(`/drivers/${d.id}/status`, { approvalStatus: status }),
    onSuccess: (_data, variables) => {
      if (variables.status !== "inactive") toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["drivers"] });
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

      <InviteCard />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ApprovalStatus)}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">Veículo</TableHead>
                    <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                    {tab === "active" && (
                      <TableHead className="hidden sm:table-cell">Entregas</TableHead>
                    )}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-medium">{d.full_name || "—"}</div>
                        {d.document && (
                          <div className="text-xs text-muted-foreground">Doc: {d.document}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{d.phone || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {d.vehicle_plate || "—"}
                          {d.vehicle_type && (
                            <div className="text-xs text-muted-foreground">
                              {d.vehicle_type}
                              {d.vehicle_model ? ` · ${d.vehicle_model}` : ""}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      {tab === "active" && (
                        <TableCell className="hidden sm:table-cell">
                          <span className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {Number(d.rating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span>{d.total_deliveries}</span>
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {tab === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setStatus.mutate({ d, status: "active" })}
                                disabled={setStatus.isPending}
                              >
                                <Check className="h-4 w-4" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatus.mutate({ d, status: "inactive" })}
                                disabled={setStatus.isPending}
                              >
                                <X className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {tab === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeactivating(d)}
                              disabled={setStatus.isPending}
                            >
                              <PowerOff className="h-4 w-4" />
                              Inativar
                            </Button>
                          )}
                          {tab === "inactive" && (
                            <Button
                              size="sm"
                              onClick={() => setStatus.mutate({ d, status: "active" })}
                              disabled={setStatus.isPending}
                            >
                              <Power className="h-4 w-4" />
                              Ativar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Histórico"
                            onClick={() => setHistoryOf(d)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => setEditing(d)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            onClick={() => setRemoving(d)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DriverEditDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["drivers"] })}
      />
      <RemoveDriverDialog
        driver={removing}
        onClose={() => setRemoving(null)}
        onRemoved={() => qc.invalidateQueries({ queryKey: ["drivers"] })}
      />
      <DriverHistoryDialog driver={historyOf} onClose={() => setHistoryOf(null)} />

      <AlertDialog open={!!deactivating} onOpenChange={(v) => !v && setDeactivating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar motorista?</AlertDialogTitle>
            <AlertDialogDescription>
              O motorista será desativado e não receberá mais pedidos.
              <br />
              Ele será notificado sobre essa ação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={setStatus.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={setStatus.isPending}
              onClick={(e) => {
                e.preventDefault();
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
            >
              {setStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InviteCard() {
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; expires_at: string }>("/invites/driver");
      const url = `${window.location.origin}/driver/signup?token=${res.token}`;
      setInvite({ url, expiresAt: res.expires_at });
      toast.success("Convite gerado! Válido por 24h.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar convite");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  const waMsg = invite
    ? `Olá! Use este link para se cadastrar como motorista no VaptGás (válido por 24h): ${invite.url}`
    : "";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Convidar motorista
            </p>
            <p className="text-sm text-muted-foreground">
              Gere um link único e compartilhe. Cada link vale 24h e só pode ser usado uma vez.
            </p>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Share2 className="h-4 w-4" />
            {invite ? "Gerar novo" : "Gerar convite"}
          </Button>
        </div>
        {invite && (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="break-all font-mono text-xs text-foreground">{invite.url}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expira em {new Date(invite.expiresAt).toLocaleString("pt-BR")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(invite.url, "Link")}>
                <Copy className="h-4 w-4" /> Copiar link
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" type="button">
                  WhatsApp
                </Button>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent("Convite VaptGás - Motorista")}&body=${encodeURIComponent(waMsg)}`}
              >
                <Button variant="outline" size="sm" type="button">
                  E-mail
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DriverEditDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: Driver | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!editing;
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useMemo(() => {
    if (open && editing) {
      setFullName(editing.full_name ?? "");
      setPhone(editing.phone ?? "");
      setDocument(editing.document ?? "");
      setVehiclePlate(editing.vehicle_plate ?? "");
      setVehicleType(editing.vehicle_type ?? "");
      setVehicleModel(editing.vehicle_model ?? "");
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.patch(`/drivers/${editing.id}`, {
        fullName,
        phone,
        document: document || null,
        vehiclePlate: vehiclePlate || null,
        vehicleType: vehicleType || null,
        vehicleModel: vehicleModel || null,
      });
      toast.success("Motorista atualizado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar motorista</DialogTitle>
            <DialogDescription>Atualize os dados pessoais e do veículo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="document">Documento</Label>
                <Input
                  id="document"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vtype">Tipo</Label>
                <Input
                  id="vtype"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="Moto, Carro..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDriverDialog({
  driver,
  onClose,
  onRemoved,
}: {
  driver: Driver | null;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    if (!driver) return;
    setSubmitting(true);
    try {
      await api.delete(`/drivers/${driver.id}?deleteAccount=${deleteAccount}`);
      toast.success("Motorista removido");
      onRemoved();
      onClose();
      setDeleteAccount(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={!!driver} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover motorista?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{driver?.full_name}</span> será
            desvinculado da sua revendedora. Pedidos antigos permanecem no histórico, mas sem
            motorista associado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
          <Checkbox
            checked={deleteAccount}
            onCheckedChange={(v) => setDeleteAccount(v === true)}
            className="mt-0.5"
          />
          <span>
            Excluir também a conta de acesso do motorista
            <span className="block text-xs text-muted-foreground">
              Ele perderá o login no app. Sem isso, ele só fica desvinculado.
            </span>
          </span>
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DriverHistoryDialog({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-history", driver?.id],
    enabled: !!driver,
    queryFn: () =>
      api.get<{
        orders: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
        ratings: Array<{ rating: number; comment: string | null }>;
      }>(`/drivers/${driver!.id}/history`),
  });

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
