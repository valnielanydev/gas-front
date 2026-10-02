import { useState } from "react";
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
import { z } from "zod";
import { cpfSchema, fieldErrors, orEmpty, phoneSchema, vehiclePlateSchema } from "@/lib/validation";

// Same rules as the invite sign-up; document and vehicle fields may be left blank
const driverSchema = z.object({
  fullName: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  phone: phoneSchema,
  document: orEmpty(cpfSchema),
  vehiclePlate: orEmpty(vehiclePlateSchema),
});

type DriverErrors = Partial<Record<keyof z.infer<typeof driverSchema>, string>>;

export function DriverEditDialog({
  editing,
  onClose,
}: {
  editing: ResellerDriver | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!editing} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed by driver so the form state starts fresh for each one */}
        {editing && <DriverEditForm key={editing.id} driver={editing} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function DriverEditForm({ driver, onClose }: { driver: ResellerDriver; onClose: () => void }) {
  const { resellerId } = useAuth();
  const [fullName, setFullName] = useState(driver.full_name ?? "");
  const [phone, setPhone] = useState(driver.phone ?? "");
  const [document, setDocument] = useState(driver.document ?? "");
  const [vehiclePlate, setVehiclePlate] = useState(driver.vehicle_plate ?? "");
  const [vehicleType, setVehicleType] = useState(driver.vehicle_type ?? "");
  const [vehicleModel, setVehicleModel] = useState(driver.vehicle_model ?? "");
  const [errors, setErrors] = useState<DriverErrors>({});
  const updateDriver = useUpdateDriver(resellerId, {
    onSuccess: () => {
      toast.success("Motorista atualizado");
      onClose();
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = driverSchema.safeParse({ fullName, phone, document, vehiclePlate });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    updateDriver.mutate({
      id: driver.id,
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
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Editar motorista</DialogTitle>
        <DialogDescription>Atualize os dados pessoais e do veículo.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            aria-invalid={!!errors.fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              aria-invalid={!!errors.phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document">CPF</Label>
            <Input
              id="document"
              value={document}
              aria-invalid={!!errors.document}
              onChange={(e) => setDocument(e.target.value)}
            />
            {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plate">Placa</Label>
          <Input
            id="plate"
            value={vehiclePlate}
            aria-invalid={!!errors.vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
          />
          {errors.vehiclePlate && <p className="text-xs text-destructive">{errors.vehiclePlate}</p>}
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
  );
}
