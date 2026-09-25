import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { useUpdateDriver } from "@/queries/reseller.queries";
import type { ResellerDriver } from "@/types/driver";

export function DriverEditDialog({
  editing,
  onClose,
}: {
  editing: ResellerDriver | null;
  onClose: () => void;
}) {
  const { resellerId } = useAuth();
  const open = !!editing;
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const updateDriver = useUpdateDriver(resellerId, {
    onSuccess: () => {
      toast.success("Motorista atualizado");
      onClose();
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar"),
  });

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateDriver.mutate({
      id: editing.id,
      payload: {
        fullName,
        phone,
        document: document || null,
        vehiclePlate: vehiclePlate || null,
        vehicleType: vehicleType || null,
        vehicleModel: vehicleModel || null,
      },
    });
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
            <Button type="submit" disabled={updateDriver.isPending}>
              {updateDriver.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
