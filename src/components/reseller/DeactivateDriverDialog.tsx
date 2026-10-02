import { Loader2 } from "lucide-react";
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
import type { ResellerDriver } from "@/types/driver";

interface Props {
  driver: ResellerDriver | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateDriverDialog({ driver, pending, onClose, onConfirm }: Props) {
  return (
    <AlertDialog open={!!driver} onOpenChange={(v) => !v && onClose()}>
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
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
