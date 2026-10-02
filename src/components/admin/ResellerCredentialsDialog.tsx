import { Copy, KeyRound } from "lucide-react";
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
import type { ResellerCredentials } from "./ResellerFormDialog";

interface Props {
  credentials: ResellerCredentials | null;
  onClose: () => void;
}

export function ResellerCredentialsDialog({ credentials, onClose }: Props) {
  return (
    <Dialog open={!!credentials} onOpenChange={(v) => !v && onClose()}>
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
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
