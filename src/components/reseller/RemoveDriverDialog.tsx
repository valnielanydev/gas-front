import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/auth/AuthProvider";
import { useRemoveDriver } from "@/queries/reseller.queries";
import type { ResellerDriver } from "@/types/driver";

export function RemoveDriverDialog({
  driver,
  onClose,
}: {
  driver: ResellerDriver | null;
  onClose: () => void;
}) {
  const { resellerId } = useAuth();
  const [deleteAccount, setDeleteAccount] = useState(false);
  const removeDriver = useRemoveDriver(resellerId, {
    onSuccess: () => {
      toast.success("Motorista removido");
      onClose();
      setDeleteAccount(false);
    },
    onError: (e) => toast.error(e.message || "Erro ao remover"),
  });
  const submitting = removeDriver.isPending;

  const confirm = () => {
    if (!driver) return;
    removeDriver.mutate({ id: driver.id, deleteAccount });
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
