import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Building2, Pencil, Trash2, Copy, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminService, type CreateResellerResponse } from "@/services/admin.service";
import { AddressMapPicker, emptyAddress, type AddressValue } from "@/components/AddressMapPicker";

export const Route = createFileRoute("/master/resellers")({
  component: ResellersPage,
});

interface Reseller {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  service_radius_km: number;
  is_active: boolean;
  invite_code: string;
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function ResellersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reseller | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    code: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    service_radius_km: "5",
    adminFullName: "",
  });
  const [address, setAddress] = useState<AddressValue>(emptyAddress);

  const copyCode = async (r: Reseller) => {
    await navigator.clipboard.writeText(r.invite_code);
    setCopiedId(r.id);
    toast.success(`Código ${r.invite_code} copiado`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: resellers, isLoading } = useQuery({
    queryKey: ["resellers"],
    queryFn: () => adminService.resellers<Reseller>(),
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        cnpj: form.cnpj || null,
        phone: form.phone,
        email: form.email || null,
        postalCode: address.postalCode || null,
        street: address.street || null,
        number: address.number || null,
        complement: address.complement || null,
        neighborhood: address.neighborhood || null,
        city: address.city || null,
        state: address.state || null,
        latitude: address.latitude,
        longitude: address.longitude,
        serviceRadiusKm: Number(form.service_radius_km) || 5,
        adminFullName: form.adminFullName || form.name,
      };
      if (editing) {
        return adminService.updateReseller(editing.id, payload);
      }
      if (!address.latitude || !address.longitude) {
        throw new Error("Defina a localização no mapa antes de salvar.");
      }
      return adminService.createReseller(payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["resellers"] });
      if (res && typeof res === "object" && "loginEmail" in res) {
        const r = res as CreateResellerResponse;
        setOpen(false);
        setCredentials({ email: r.loginEmail, password: r.password, code: r.inviteCode });
        resetForm();
        toast.success("Revendedora criada! Anote as credenciais.");
      } else {
        toast.success("Revendedora atualizada");
        setOpen(false);
        resetForm();
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const toggleActive = useMutation({
    mutationFn: (r: Reseller) => adminService.updateReseller(r.id, { is_active: !r.is_active }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["resellers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteReseller(id),
    onSuccess: () => {
      toast.success("Revendedora removida");
      qc.invalidateQueries({ queryKey: ["resellers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      cnpj: "",
      phone: "",
      email: "",
      service_radius_km: "5",
      adminFullName: "",
    });
    setAddress(emptyAddress);
  };

  const openEdit = (r: Reseller) => {
    setEditing(r);
    setForm({
      name: r.name,
      cnpj: r.cnpj ?? "",
      phone: r.phone ?? "",
      email: r.email ?? "",
      service_radius_km: String(r.service_radius_km),
      adminFullName: "",
    });
    setAddress({
      postalCode: r.postal_code ?? "",
      street: r.street ?? "",
      number: r.number ?? "",
      complement: r.complement ?? "",
      neighborhood: r.neighborhood ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revendedoras</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as revendedoras da plataforma
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Revendedora" : "Nova Revendedora"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              {!editing && (
                <div className="sm:col-span-2 space-y-2">
                  <Label>Nome do administrador *</Label>
                  <Input
                    required
                    value={form.adminFullName}
                    onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                    placeholder="Pessoa responsável"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone {!editing && "*"}</Label>
                <Input
                  required
                  value={form.phone}
                  placeholder="(11) 99999-9999"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>E-mail {!editing && "* (será o login)"}</Label>
                <Input
                  type="email"
                  required={!editing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Raio de atendimento (km)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={form.service_radius_km}
                  onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 border-t pt-4">
                <h3 className="mb-3 text-sm font-semibold">Endereço e localização</h3>
                {open && <AddressMapPicker value={address} onChange={setAddress} />}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!form.phone.trim()) {
                    toast.error("Telefone é obrigatório");
                    return;
                  }
                  upsertMutation.mutate();
                }}
                disabled={
                  !form.name || !form.phone.trim() || !address.latitude || upsertMutation.isPending
                }
              >
                {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!credentials} onOpenChange={(v) => !v && setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Credenciais geradas
            </DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Compartilhe com a revendedora. Esta senha não será exibida novamente.
              </p>
              {(["email", "password", "code"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <Label>
                    {key === "email"
                      ? "E-mail (login)"
                      : key === "password"
                        ? "Senha"
                        : "Código da revendedora"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={credentials[key]}
                      className={key !== "email" ? "font-mono" : ""}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(credentials[key]);
                        toast.success("Copiado");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !resellers?.length ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma revendedora cadastrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="hidden md:table-cell">Cidade/UF</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resellers.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => copyCode(r)}
                      className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 font-mono text-xs font-semibold tracking-wider hover:bg-muted transition-colors"
                      title="Copiar código"
                    >
                      {r.invite_code}
                      {copiedId === r.id ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {r.city ? `${r.city}/${r.state ?? "-"}` : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{r.phone ?? "—"}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive.mutate(r)}>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remover "${r.name}"?`)) deleteMutation.mutate(r.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
