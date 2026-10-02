import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressMapPicker } from "@/components/address/AddressMapPicker";
import { emptyAddress } from "@/lib/address";
import type { AddressValue } from "@/types/address";
import { useSaveReseller } from "@/queries/admin.queries";
import type { AdminReseller } from "@/types/admin";

export interface ResellerCredentials {
  email: string;
  password: string;
  code: string;
}

interface Props {
  open: boolean;
  /** Reseller being edited, or `null` to create a new one. */
  reseller: AdminReseller | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (credentials: ResellerCredentials) => void;
}

function initialForm(r: AdminReseller | null) {
  return {
    name: r?.name ?? "",
    cnpj: r?.cnpj ?? "",
    phone: r?.phone ?? "",
    email: r?.email ?? "",
    service_radius_km: r ? String(r.service_radius_km) : "5",
    adminFullName: "",
  };
}

function initialAddress(r: AdminReseller | null): AddressValue {
  if (!r) return emptyAddress;
  return {
    postalCode: r.postal_code ?? "",
    street: r.street ?? "",
    number: r.number ?? "",
    complement: r.complement ?? "",
    neighborhood: r.neighborhood ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
  };
}

/**
 * Create/edit form. State is initialised from `reseller` on mount, so the parent should
 * change the component `key` whenever it opens the dialog for a different reseller.
 */
export function ResellerFormDialog({ open, reseller, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(() => initialForm(reseller));
  const [address, setAddress] = useState<AddressValue>(() => initialAddress(reseller));

  const upsertMutation = useSaveReseller({
    onSuccess: (res) => {
      onOpenChange(false);
      if (res && "loginEmail" in res) {
        onCreated({ email: res.loginEmail, password: res.password, code: res.inviteCode });
        toast.success("Revendedora criada! Anote as credenciais.");
      } else {
        toast.success("Revendedora atualizada");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const saveReseller = () => {
    if (!reseller && (!address.latitude || !address.longitude)) {
      toast.error("Defina a localização no mapa antes de salvar.");
      return;
    }
    upsertMutation.mutate({
      id: reseller?.id ?? null,
      payload: {
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
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reseller ? "Editar Revendedora" : "Nova Revendedora"}</DialogTitle>
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
          {!reseller && (
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
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone {!reseller && "*"}</Label>
            <Input
              required
              value={form.phone}
              placeholder="(11) 99999-9999"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>E-mail {!reseller && "* (será o login)"}</Label>
            <Input
              type="email"
              required={!reseller}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!form.phone.trim()) {
                toast.error("Telefone é obrigatório");
                return;
              }
              saveReseller();
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
  );
}
