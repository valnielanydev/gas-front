import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/integrations/api/client";
import { authService } from "@/services/auth.service";

interface Props {
  trigger?: ReactNode;
}

export function ChangePasswordDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return toast.error("A nova senha precisa ter no mínimo 6 caracteres");
    if (next !== confirm) return toast.error("As senhas não coincidem");

    setLoading(true);
    try {
      await authService.changePassword(current, next);
      toast.success("Senha alterada com sucesso!");
      reset();
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Senha atual incorreta");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Erro ao alterar senha");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <KeyRound className="mr-2 h-4 w-4" /> Alterar senha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="z-700">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Confirme sua senha atual e defina uma nova.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cur">Senha atual</Label>
            <Input
              id="cur"
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">Nova senha</Label>
            <Input
              id="new"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf">Confirmar nova senha</Label>
            <Input
              id="conf"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
