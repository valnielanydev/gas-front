import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";
import { ApiError } from "@/integrations/api/client";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/customer/profile/seguranca")({
  component: SecurityPage,
});

function SecurityPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (next.length < 6) return toast.error("A nova senha precisa ter no mínimo 6 caracteres");
    if (next !== confirm) return toast.error("As senhas não coincidem");

    setLoading(true);
    try {
      await authService.changePassword(current, next);
      toast.success("Senha atualizada");
      navigate({ to: "/customer/profile" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Senha atual incorreta");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar senha");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Segurança" />
      <div className="px-5 pt-1">
        <div className="mb-4.5">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">
            Senha atual
          </Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div className="mb-4.5">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">
            Nova senha
          </Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Digite a nova senha"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">
            Confirmar nova senha
          </Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button onClick={() => void save()} disabled={loading} className="w-full" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          Atualizar senha
        </Button>
      </div>
    </div>
  );
}
